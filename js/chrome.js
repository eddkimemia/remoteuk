/**
 * Shared site header + footer for RemoteMedicalJobs.
 * Usage:
 *   <div id="site-header" data-active="jobs|course|jobseekers|about|contact|apply|success"></div>
 *   ...
 *   <div id="site-footer"></div>
 *   <script src="/js/chrome.js"></script>
 */
(function () {
    'use strict';

    var LINKS = [
        { id: 'jobs', href: 'jobs.html', label: 'Jobs' },
        { id: 'course', href: 'course.html', label: 'Course' },
        { id: 'jobseekers', href: 'jobseekers.html', label: 'Job Seekers' },
        { id: 'about', href: 'about.html', label: 'About' },
        { id: 'contact', href: 'contact.html', label: 'Contact' }
    ];

    var YEAR = new Date().getFullYear();

    function detectActive() {
        var header = document.getElementById('site-header');
        if (header && header.getAttribute('data-active')) {
            return header.getAttribute('data-active');
        }
        var path = (location.pathname || '').split('/').pop() || 'index.html';
        path = path.toLowerCase();
        if (!path || path === '' || path === '/' || path.indexOf('index') === 0) return 'jobs';
        if (path.indexOf('jobs') === 0) return 'jobs';
        if (path.indexOf('course-access') === 0) return 'course';
        if (path.indexOf('course') === 0) return 'course';
        if (path.indexOf('jobseekers') === 0) return 'jobseekers';
        if (path.indexOf('about') === 0) return 'about';
        if (path.indexOf('contact') === 0) return 'contact';
        if (path.indexOf('apply') === 0) return 'apply';
        if (path.indexOf('success') === 0) return 'success';
        return '';
    }

    function navLinksHtml(active, isMobile) {
        return LINKS.map(function (l) {
            var cls = l.id === active ? (isMobile ? 'mobile-link active' : 'active') : (isMobile ? 'mobile-link' : '');
            if (isMobile) {
                return '<a href="' + l.href + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + l.label + '</a>';
            }
            return '<li><a href="' + l.href + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + l.label + '</a></li>';
        }).join('');
    }

    function headerHtml(active) {
        return (
            '<nav class="nav site-nav" id="nav" role="navigation" aria-label="Main">' +
            '  <div class="nav-inner">' +
            '    <a href="index.html" class="nav-logo">' +
            '      <div class="nav-logo-icon"><span class="iconify" data-icon="mdi:stethoscope" aria-hidden="true"></span></div>' +
            '      RemoteMedical<span>Jobs</span>' +
            '    </a>' +
            '    <ul class="nav-links">' + navLinksHtml(active, false) + '</ul>' +
            '    <div class="nav-cta">' +
            '      <a href="course.html" class="btn btn-primary">Career Accelerator</a>' +
            '    </div>' +
            '    <button class="mobile-toggle" id="mobileToggle" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobileMenu">' +
            '      <span class="iconify" data-icon="mdi:menu" style="font-size:28px" id="menuIcon" aria-hidden="true"></span>' +
            '    </button>' +
            '  </div>' +
            '</nav>' +
            '<div class="mobile-menu" id="mobileMenu">' +
            navLinksHtml(active, true) +
            '<a href="course.html" class="btn btn-primary btn-lg mobile-link">Career Accelerator</a>' +
            '<a href="apply.html" class="btn btn-green btn-lg mobile-link">Apply for Roles</a>' +
            '</div>'
        );
    }

    function footerHtml() {
        return (
            '<footer class="footer site-footer" role="contentinfo">' +
            '  <div class="footer-inner footer-inner--grid">' +
            '    <div class="footer-grid">' +
            '      <div class="footer-brand-block">' +
            '        <a href="index.html" class="footer-brand">' +
            '          <div class="footer-brand-icon"><span class="iconify" data-icon="mdi:stethoscope" aria-hidden="true"></span></div>' +
            '          RemoteMedical<span>Jobs</span>' +
            '        </a>' +
            '        <p class="footer-blurb">Remote healthcare careers and practical Career Accelerator training. Browse roles, apply free, and unlock interview-ready skills when you are ready to stand out.</p>' +
            '        <p class="footer-contact"><a href="mailto:hello@remotemedicaljobs.com">hello@remotemedicaljobs.com</a></p>' +
            '      </div>' +
            '      <div class="footer-col">' +
            '        <h4>Start here</h4>' +
            '        <a href="jobs.html">Browse remote jobs</a>' +
            '        <a href="apply.html">Apply free</a>' +
            '        <a href="salary-guide.html">Salary guide</a>' +
            '        <a href="why-remote.html">Why remote healthcare</a>' +
            '        <a href="course.html">Career Accelerator</a>' +
            '        <a href="jobseekers.html">Job seeker hub</a>' +
            '      </div>' +
            '      <div class="footer-col">' +
            '        <h4>For employers</h4>' +
            '        <a href="contact.html">Hire remote talent</a>' +
            '        <a href="index.html#employers">Workforce solutions</a>' +
            '        <a href="contact.html">Book a strategy call</a>' +
            '      </div>' +
            '      <div class="footer-col">' +
            '        <h4>Company</h4>' +
            '        <a href="about.html">About us</a>' +
            '        <a href="contact.html">Contact</a>' +
            '        <a href="privacy.html">Privacy policy</a>' +
            '        <a href="terms.html">Terms of service</a>' +
            '      </div>' +
            '    </div>' +
            '    <div class="footer-bottom">' +
            '      <p>© ' + YEAR + ' RemoteMedicalJobs. Remote healthcare careers · Global.</p>' +
            '      <div class="footer-bottom-links">' +
            '        <a href="privacy.html">Privacy</a>' +
            '        <a href="terms.html">Terms</a>' +
            '        <a href="course.html">Enrol now</a>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</footer>'
        );
    }

    function wireMobileMenu() {
        var toggle = document.getElementById('mobileToggle');
        var menu = document.getElementById('mobileMenu');
        var icon = document.getElementById('menuIcon');
        if (!toggle || !menu) return;

        function setOpen(open) {
            menu.classList.toggle('active', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (icon) {
                icon.setAttribute('data-icon', open ? 'mdi:close' : 'mdi:menu');
            }
            document.body.classList.toggle('nav-open', open);
            document.body.style.overflow = open ? 'hidden' : '';
        }

        if (toggle.getAttribute('data-chrome-bound') === '1') return;
        toggle.setAttribute('data-chrome-bound', '1');

        toggle.addEventListener('click', function () {
            setOpen(!menu.classList.contains('active'));
        });

        menu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () {
                setOpen(false);
            });
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 900) setOpen(false);
        });
    }

    function wireScrollNav() {
        var nav = document.getElementById('nav');
        if (!nav) return;
        var onScroll = function () {
            nav.classList.toggle('scrolled', window.scrollY > 20);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function init() {
        var active = detectActive();
        var headerMount = document.getElementById('site-header');
        var footerMount = document.getElementById('site-footer');

        if (headerMount) {
            var pad = headerMount.getAttribute('data-pad');
            headerMount.outerHTML = headerHtml(active);
            document.body.classList.add('has-site-nav');
            if (pad === 'false' || pad === '0') {
                document.body.classList.add('no-nav-pad');
            }
        }
        if (footerMount) {
            footerMount.outerHTML = footerHtml();
        }

        wireMobileMenu();
        wireScrollNav();

        // Refresh Iconify after dynamic inject
        if (window.Iconify && typeof window.Iconify.scan === 'function') {
            try { window.Iconify.scan(); } catch (e) {}
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
