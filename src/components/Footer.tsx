import React, { useState } from 'react';
import '../styles/Footer.css';

/**
 * Compact Commonwealth University footer.
 *
 * The footer starts collapsed to preserve map space, then expands in place for
 * portfolio/production links without navigating away from the tracker.
 */
export function Footer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <footer className="app-footer">
      <div className={`footer-content${expanded ? ' footer-content--open' : ''}`}>
        <div className="footer-section">
          <h4><strong>Our Locations</strong></h4>
          <ul>
            <li><a href="https://www.commonwealthu.edu/campus-life/bloomsburg">Bloomsburg</a></li>
            <li><a href="https://www.commonwealthu.edu/campus-life/lock-haven">Lock Haven</a></li>
            <li><a href="https://www.commonwealthu.edu/campus-life/mansfield">Mansfield</a></li>
            <li><a href="https://www.commonwealthu.edu/campus-life/clearfield">Clearfield</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4><strong>Helpful Links</strong></h4>
          <ul>
            <li><a href="https://www.commonwealthu.edu/people-directory">Faculty &amp; Staff Directory</a></li>
            <li><a href="https://www.commonwealthu.edu/offices-directory">Offices &amp; Departments</a></li>
            <li><a href="https://www.commonwealthu.edu/my-commonwealthu">My CommonwealthU</a></li>
            <li><a href="https://library.commonwealthu.edu/home">Library</a></li>
            <li><a href="https://www.commonwealthu.edu/offices-directory/human-resources/hrconnect">HRConnect</a></li>
            <li><a href="https://portal.passhe.edu/irj/portal">ESS and eTime</a></li>
            <li><a href="https://commonwealthu.peopleadmin.com/">Employment Opportunities</a></li>
            <li><a href="https://www.commonwealthu.edu/alert/emergency-alert-notification-system">CU Alert</a></li>
            <li><a href="https://www.commonwealthu.edu/social-media">Social Media</a></li>
            <li><a href="https://www.commonwealthu.edu/forms/report-broken-link">Report a Website Problem</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4><strong>Legal</strong></h4>
          <ul>
            <li><a href="https://www.commonwealthu.edu/about/accreditation">Accreditation</a></li>
            <li><a href="https://www.commonwealthu.edu/offices-directory/university-police/annual-security-report">Annual Security and Fire Safety Reports</a></li>
            <li><a href="https://secure.ethicspoint.com/domain/media/en/gui/37117/index.html">Fraud, Waste &amp; Abuse Hotline</a></li>
            <li><a href="https://www.commonwealthu.edu/offices-directory/institutional-effectiveness/compliance/right-to-know-requests">Right-To-Know</a></li>
            <li><a href="https://www.commonwealthu.edu/about/consumer-information">Consumer Information</a></li>
            <li><a href="https://www.commonwealthu.edu/offices-directory/title-ix">Title IX</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-links">
            <a href="https://www.facebook.com/bloomsburgu/" className="social-icon" title="Facebook"><span>f</span></a>
            <a href="https://x.com/BloomsburgU" className="social-icon" title="Twitter"><span>𝕏</span></a>
            <a href="https://www.instagram.com/bloomsburgu/" className="social-icon" title="Instagram"><span>📷</span></a>
            <a href="https://www.linkedin.com/school/cu-bloomsburg/posts/?feedView=all" className="social-icon" title="LinkedIn"><span>in</span></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="copyright">
          &copy; {new Date().getFullYear()} Commonwealth University of Pennsylvania
        </div>
        <button
          className="footer-expand-btn"
          onClick={() => setExpanded(e => !e)}
          aria-label={expanded ? 'Hide footer info' : 'Show footer info'}
        >
          {expanded ? 'Less ▾' : 'More ▴'}
        </button>
        <div className="footer-links">
          <a href="https://www.commonwealthu.edu/privacy-policy">Privacy</a>
          <span className="divider">·</span>
          <a href="https://www.commonwealthu.edu/accessibility">Accessibility</a>
        </div>
      </div>
    </footer>
  );
}
