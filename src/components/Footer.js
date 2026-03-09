import React from 'react';
import '../styles/Footer.css';

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>About</h4>
          <ul>
            <li><a href="#about">About Bloomsburg</a></li>
            <li><a href="#transit">Transit System</a></li>
            <li><a href="#history">History</a></li>
            <li><a href="#careers">Careers</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Resources</h4>
          <ul>
            <li><a href="#schedules">Bus Schedules</a></li>
            <li><a href="#routes">Routes & Maps</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#accessibility">Accessibility</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <ul>
            <li>
              <strong>Bloomsburg University</strong><br />
              400 East Second Street<br />
              Bloomsburg, PA 17815
            </li>
            <li><a href="tel:5704896000">570-389-4000</a></li>
            <li><a href="mailto:info@bloomu.edu">info@bloomu.edu</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-links">
            <a href="#facebook" className="social-icon" title="Facebook">
              <span>f</span>
            </a>
            <a href="#twitter" className="social-icon" title="Twitter">
              <span>𝕏</span>
            </a>
            <a href="#instagram" className="social-icon" title="Instagram">
              <span>📷</span>
            </a>
            <a href="#linkedin" className="social-icon" title="LinkedIn">
              <span>in</span>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <span className="divider">|</span>
          <a href="#terms">Terms of Service</a>
          <span className="divider">|</span>
          <a href="#accessibility">Accessibility</a>
          <span className="divider">|</span>
          <a href="#contact">Contact Us</a>
        </div>
        <div className="copyright">
          &copy; {new Date().getFullYear()} Bloomsburg University. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
