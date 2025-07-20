import React from 'react'
import PropTypes from 'prop-types'
import './DownloadPanel.css'
import DownloadLink from './DownloadLink'

/**
 * DownloadPanel
 * Renders a list of DownloadLink components
 * Props:
 *  - links: Array of { name, url, type }
 */
export default function DownloadPanel({ links }) {
    if (!links || links.length === 0) return null
    return (
        <div className="download-panel">
            <h2>Download Analysis Files</h2>
            <ul className="download-list">
                {links.map((link, idx) => (
                    <DownloadLink key={idx} link={link} />
                ))}
            </ul>
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
