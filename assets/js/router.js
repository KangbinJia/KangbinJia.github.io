/**
 * Router - Handles client-side routing and dynamic content loading
 * Loads navigation, footer, and section content dynamically
 */

class Router {
    constructor() {
        this.currentSection = 'home';
        this.sectionFiles = {
            home: 'home.html',
            accomplishments: 'accomplishments.html',
            coursework: 'coursework.html',
            videos: 'videos.html',
            writing: 'writing.html',
            sports: 'sports.html',
            resume: 'resume.html',
            travels: 'travels.html',
            community: 'community.html'
        };
        this.sections = Object.keys(this.sectionFiles);
        this.components = {
            nav: null,
            footer: null,
            sections: {}
        };
    }

    /**
     * Initialize router - load all components and set up event listeners
     */
    async init() {
        try {
            // Load navigation and footer components
            await this.loadNav();
            await this.loadFooter();

            // Load all section components
            for (let section of this.sections) {
                await this.loadSection(section);
            }

            // Set up event listeners for navigation
            this.setupNavigation();

            // Handle initial route based on hash
            this.handleRoute();

            // Listen for hash changes
            window.addEventListener('hashchange', () => this.handleRoute());

            // If no hash, default to home
            if (!window.location.hash) {
                window.location.hash = '#home';
            }
        } catch (error) {
            console.error('Router initialization failed:', error);
        }
    }

    /**
     * Load navigation component
     */
    async loadNav() {
        try {
            const response = await fetch('components/nav.html');
            const html = await response.text();
            this.components.nav = html;
            document.getElementById('navbar-container').innerHTML = html;

            // Setup mobile navigation after loading nav
            if (window.setupMobileNavigation) {
                window.setupMobileNavigation();
            }

            // Setup theme selector after loading nav
            if (window.setupThemeSelector) {
                window.setupThemeSelector();
            }
        } catch (error) {
            console.error('Failed to load navigation:', error);
        }
    }

    /**
     * Load footer component
     */
    async loadFooter() {
        try {
            const response = await fetch('components/footer.html');
            const html = await response.text();
            this.components.footer = html;
            document.getElementById('footer-container').innerHTML = html;

            // Update footer year after loading
            if (window.updateFooterYear) {
                window.updateFooterYear();
            }
        } catch (error) {
            console.error('Failed to load footer:', error);
        }
    }

    /**
     * Load a section component
     * Prefer the flat layout and fall back to the legacy folder structure.
     */
    async loadSection(section) {
        const primaryPath = this.sectionFiles[section] || `${section}.html`;
        const fallbackPath = `${section}/${section}.html`;
        const candidatePaths = [primaryPath, fallbackPath];

        for (const path of candidatePaths) {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    continue;
                }

                const html = await response.text();
                this.components.sections[section] = html;
                return;
            } catch (error) {
                // Try the next candidate path.
            }
        }

        console.error(`Failed to load section ${section} from any supported path.`);
    }

    /**
     * Set up navigation event listeners
     */
    setupNavigation() {
        // Nav links with data-section attribute
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-section]');
            if (link) {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                window.location.hash = `#${section}`;
            }
        });
    }

    /**
     * Handle route changes and display appropriate section
     */
    handleRoute() {
        let section = window.location.hash.slice(1);

        // Validate section
        if (!this.sections.includes(section)) {
            section = 'home';
            window.location.hash = '#home';
        }

        this.currentSection = section;
        this.displaySection(section);
        this.updateNavigation();
    }

    /**
     * Display a section in the viewport
     */
    displaySection(section) {
        const viewport = document.getElementById('content-viewport');

        if (this.components.sections[section]) {
            const fragment = document.createElement('div');
            fragment.innerHTML = this.components.sections[section];

            viewport.innerHTML = '';
            viewport.appendChild(fragment);
            this.executeSectionScripts(viewport);

            // Re-initialize features that depend on DOM
            this.initializeSectionFeatures(section);

            // Scroll to top
            window.scrollTo(0, 0);
        }
    }

    executeSectionScripts(container) {
        const scripts = Array.from(container.querySelectorAll('script'));

        scripts.forEach((script) => {
            const newScript = document.createElement('script');

            Array.from(script.attributes).forEach((attribute) => {
                newScript.setAttribute(attribute.name, attribute.value);
            });

            newScript.textContent = script.textContent;
            script.replaceWith(newScript);
        });
    }

    /**
     * Initialize section-specific features
     */
    initializeSectionFeatures(section) {
        if (section === 'community') {
            // Reinitialize community filter when community section is displayed
            if (typeof window.CommunityFilter === 'function' || typeof CommunityFilter === 'function') {
                window.communityFilter = new CommunityFilter();
            }
        }
    }

    /**
     * Update navigation active states
     */
    updateNavigation() {
        document.querySelectorAll('[data-section]').forEach(link => {
            const section = link.getAttribute('data-section');
            if (section === this.currentSection) {
                link.classList.add('active');
                link.parentElement?.classList.add('active');
            } else {
                link.classList.remove('active');
                link.parentElement?.classList.remove('active');
            }
        });
    }
}

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const router = new Router();
    router.init();

    // Make router globally accessible for main.js
    window.appRouter = router;
});
