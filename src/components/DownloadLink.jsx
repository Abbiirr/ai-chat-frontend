import React from 'react'
import PropTypes from 'prop-types'
import './DownloadLink.css'

/**
 * DownloadLink
 * Renders a single link item for downloading a file
 * Props:
 *  - link: { name, url, type }
 */
export default function DownloadLink({ link }) {
    const icon = link.type === 'master_summary' ? '📊' : '📄'
    return (
        <li>
            <a
                href={link.url}
                download={link.name}
                target="_blank"
                rel="noopener noreferrer"
                className="download-link"
            >
                {icon} {link.name}
            </a>
        </li>
    )
}

DownloadLink.propTypes = {
    link: PropTypes.shape({
        name: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
    }).isRequired,
}
