import React from 'react';
import PropTypes from 'prop-types';

export default function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

Badge.propTypes = {
  children: PropTypes.node,
};
