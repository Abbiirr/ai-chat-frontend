import type {
  ParsedSummaryContent,
  SummaryMetadata,
  CustomerDispute,
  TraceAnalysis,
  TimelineEntry,
} from "../types";

/**
 * Parse raw summary content text into structured format
 */
export function parseSummaryContent(
  rawContent: string,
  filename: string
): ParsedSummaryContent {
  const lines = rawContent.split("\n");

  return {
    metadata: parseMetadata(lines, filename),
    customerDispute: parseCustomerDispute(lines),
    traces: parseTraces(lines),
    timeline: parseTimeline(lines),
    rawContent,
  };
}

/**
 * Extract date from filename pattern: master_summary_YYYYMMDD_HHMMSS.txt
 */
function extractDateFromFilename(filename: string): string {
  const match = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
  }
  return "Unknown";
}

/**
 * Extract metadata from header section
 */
function parseMetadata(lines: string[], filename: string): SummaryMetadata {
  const findValue = (pattern: RegExp): string => {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) return match[1].trim();
    }
    return "";
  };

  return {
    filename,
    generatedDate:
      findValue(/Generated:\s*(.+)/i) || extractDateFromFilename(filename),
    totalTraces: parseInt(findValue(/Total Traces.*?:\s*(\d+)/i) || "0", 10),
    totalLogEntries: parseInt(
      findValue(/Total Log Entries:\s*(\d+)/i) || "0",
      10
    ),
    model: findValue(/Analysis Model:\s*(.+)/i) || "Unknown",
  };
}

/**
 * Parse customer dispute section
 */
function parseCustomerDispute(lines: string[]): CustomerDispute | null {
  let inSection = false;
  let date = "";
  let username = "";
  let rawTextLines: string[] = [];
  let sectionStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("ORIGINAL CUSTOMER DISPUTE")) {
      inSection = true;
      sectionStart = i;
      continue;
    }

    if (inSection) {
      // Check if we hit the next section header (all caps with multiple dashes)
      if (
        line.match(/^[A-Z]{2,}/) &&
        i > sectionStart + 1 &&
        !line.includes("ORIGINAL")
      ) {
        break;
      }

      // Skip separator lines
      if (line.match(/^-+$/)) continue;

      // Try to extract structured data
      const dateMatch = line.match(/date\s+is\s+(.+)/i);
      const userMatch = line.match(/username\s+is\s+(.+)/i);

      if (dateMatch) {
        date = dateMatch[1].trim();
      } else if (userMatch) {
        username = userMatch[1].trim();
      } else if (line.trim()) {
        rawTextLines.push(line.trim());
      }
    }
  }

  // If we found structured data, return it
  if (date || username) {
    return { date, username };
  }

  // If we found raw text but no structured data, return as rawText
  if (rawTextLines.length > 0) {
    return {
      date: "",
      username: "",
      rawText: rawTextLines.join(" "),
    };
  }

  return null;
}

/**
 * Parse trace analysis section
 */
function parseTraces(lines: string[]): TraceAnalysis[] {
  const traces: TraceAnalysis[] = [];
  let inSection = false;
  let currentTrace: Partial<TraceAnalysis> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("TRACE ANALYSIS SUMMARY")) {
      inSection = true;
      continue;
    }

    if (
      inSection &&
      (line.includes("TRANSACTION TIMELINE") ||
        line.includes("COMPREHENSIVE TRANSACTION TIMELINE") ||
        line.includes("END OF MASTER SUMMARY"))
    ) {
      // Save last trace and exit
      if (currentTrace?.traceId) {
        traces.push(currentTrace as TraceAnalysis);
      }
      break;
    }

    if (inSection) {
      // Match "TRACE N: <traceId>"
      const traceHeaderMatch = line.match(/^TRACE\s+(\d+):\s*([a-f0-9]+)/i);
      if (traceHeaderMatch) {
        // Save previous trace
        if (currentTrace?.traceId) {
          traces.push(currentTrace as TraceAnalysis);
        }
        currentTrace = {
          traceNumber: parseInt(traceHeaderMatch[1], 10),
          traceId: traceHeaderMatch[2],
          relevanceScore: 0,
          transactionStatus: "Unknown",
          keyFinding: "",
          recommendation: "",
        };
        continue;
      }

      if (currentTrace) {
        // Match "Relevance Score: N/100"
        const scoreMatch = line.match(/Relevance Score:\s*(\d+)/i);
        if (scoreMatch) {
          currentTrace.relevanceScore = parseInt(scoreMatch[1], 10);
          continue;
        }

        // Match "Transaction Status: X"
        const statusMatch = line.match(/Transaction Status:\s*(.+)/i);
        if (statusMatch) {
          currentTrace.transactionStatus = statusMatch[1].trim();
          continue;
        }

        // Match "Key Finding: X"
        const findingMatch = line.match(/Key Finding:\s*(.+)/i);
        if (findingMatch) {
          currentTrace.keyFinding = findingMatch[1].trim();
          continue;
        }

        // Match "Recommendation: X"
        const recMatch = line.match(/Recommendation:\s*(.+)/i);
        if (recMatch) {
          const recValue = recMatch[1].trim();
          currentTrace.recommendation = parseRecommendation(recValue);
          continue;
        }
      }
    }
  }

  return traces;
}

/**
 * Parse recommendation string - handles JSON arrays, numbered lists, and plain text
 */
function parseRecommendation(value: string): string | string[] {
  // Try JSON array first
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim());
      }
    } catch {
      // Not valid JSON, continue to other parsing
    }
  }

  // Try numbered list pattern: "1. First 2. Second" or "1. First\n2. Second"
  const numberedPattern = /\d+\.\s+/g;
  if (numberedPattern.test(value)) {
    const items = value
      .split(/\d+\.\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (items.length > 1) {
      return items;
    }
  }

  // Return as plain string
  return value;
}

/**
 * Parse timeline section
 */
function parseTimeline(lines: string[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let inSection = false;

  for (const line of lines) {
    if (
      line.includes("TRANSACTION TIMELINE") ||
      line.includes("COMPREHENSIVE TRANSACTION TIMELINE")
    ) {
      inSection = true;
      continue;
    }

    if (inSection && line.includes("END OF MASTER SUMMARY")) {
      break;
    }

    if (inSection) {
      // Match numbered entries: "  1. 2025-12-18 05:59:27.816 | TRACE | service | traceId | message"
      const entryMatch = line.match(
        /^\s*(\d+)\.\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s*\|\s*(\w+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)/
      );

      if (entryMatch) {
        entries.push({
          index: parseInt(entryMatch[1], 10),
          timestamp: entryMatch[2].trim(),
          level: normalizeLevel(entryMatch[3].trim()),
          service: entryMatch[4].trim(),
          traceId: entryMatch[5].trim().replace(/\.\.\.+$/, ""),
          message: entryMatch[6].trim(),
        });
      }
    }
  }

  return entries;
}

/**
 * Normalize log level string to valid type
 */
function normalizeLevel(level: string): TimelineEntry["level"] {
  const normalized = level.toUpperCase();
  if (["INFO", "WARN", "ERROR", "TRACE", "DEBUG"].includes(normalized)) {
    return normalized as TimelineEntry["level"];
  }
  return "INFO";
}
