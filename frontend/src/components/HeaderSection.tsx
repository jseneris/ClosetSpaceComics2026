import React from 'react';
import logo from '../logo125.png';

export const HeaderSection: React.FC = () => {
  return (
    <header>
      <img className="header-logo" src={logo} alt="Closet Space Comics logo" />
    </header>
  );
};

export default HeaderSection;
