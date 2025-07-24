import React from 'react'
import PropTypes from 'prop-types'
import './DownloadPanel.css'
import DownloadLink from './DownloadLink'

/**
 * DownloadPanel
 * Renders a list of DownloadLink components organized by category
 * Props:
 *  - links: Array of { name, url, type }
 */
export default function DownloadPanel({ links }) {
    if (!links || links.length === 0) return null

    // Group links by type/category
    const groupedLinks = links.reduce((acc, link) => {
        const category = link.type;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(link);
        return acc;
    }, {});

    // Define category display names and order
    const categoryConfig = {
        'relevant': {
            title: '🎯 Highly Relevant Files',
            className: 'relevant-section'
        },
        'less_relevant': {
            title: '⚠️ Less Relevant Files',
            className: 'less-relevant-section'
        },
        'not_relevant': {
            title: '❌ Not Relevant Files',
            className: 'not-relevant-section'
        },
        'trace_analysis': {
            title: '📄 Trace Analysis Files',
            className: 'trace-analysis-section'
        },
        'master_summary': {
            title: '📊 Master Summary',
            className: 'master-summary-section'
        },
        'verification': {
            title: '✅ Verification Files',
            className: 'verification-section'
        }
    };

    return (
        <div className="download-panel">
            <h2>Download Analysis Files</h2>

            {Object.entries(groupedLinks).map(([category, categoryLinks]) => {
                const config = categoryConfig[category] || {
                    title: `📁 ${category.charAt(0).toUpperCase() + category.slice(1)} Files`,
                    className: 'default-section'
                };

                return (
                    <div key={category} className={`download-section ${config.className}`}>
                        <h3 className="section-title">{config.title}</h3>
                        <ul className="download-list">
                            {categoryLinks.map((link, idx) => (
                                <DownloadLink key={`${category}-${idx}`} link={link} />
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    )
}

DownloadPanel.propTypes = {
    links: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
        })
    ).isRequired,
}