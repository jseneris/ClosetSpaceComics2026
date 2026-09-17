import React from 'react';
import logo from '../logo125.png';

export const FooterSection: React.FC = () => {
  return (
    <footer>
      <div className="row logo">
        <img src={logo} alt="logo" />
      </div>
      <div className="row copy">
        <p>Copyright &copy; 2026 by Closet Space Comics. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default FooterSection;
