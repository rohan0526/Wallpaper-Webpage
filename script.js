// API Configuration
const PIXABAY_API_KEY = ''; // Pixabay API key
const PIXABAY_API_URL = 'https://pixabay.com/api/';

// DOM Elements
const wallpaperGrid = document.getElementById('wallpaper-grid');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const closeBtn = document.querySelector('.close-btn');
const downloadBtn = document.getElementById('download-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const filterButtons = document.querySelectorAll('.filter-btn');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const showFavoritesBtn = document.getElementById('show-favorites');

// State variables
let wallpapers = []; // Will be populated from API
let currentWallpaper = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentFilter = 'all';
let isShowingFavorites = false;
let isLoading = false;

// Initialize the gallery
async function initGallery() {
    setupEventListeners();
    checkDarkModePreference();
    await fetchWallpapers();
}

// Fetch wallpapers from Pixabay API
async function fetchWallpapers(searchTerm = '') {
    try {
        isLoading = true;
        showLoadingIndicator();
        
        // Determine category/query parameter based on current filter
        let query = searchTerm || '';
        
        // Map our UI categories to better search terms
        if (currentFilter !== 'all' && !searchTerm) {
            switch(currentFilter) {
                case 'nature':
                    query = 'nature landscape';
                    break;
                case 'abstract':
                    query = 'abstract background';
                    break;
                case 'anime':
                    query = 'anime digital art';
                    break;
                case 'space':
                    query = 'space galaxy';
                    break;
                case 'minimal':
                    query = 'minimalist background';
                    break;
                case 'architecture':
                    query = 'architecture buildings';
                    break;
                case 'cars':
                    query = 'cars vehicles';
                    break;
                case 'animals':
                    query = 'animals wildlife';
                    break;
                case 'food':
                    query = 'food cuisine';
                    break;
                case 'travel':
                    query = 'travel destinations';
                    break;
                case 'technology':
                    query = 'technology gadgets';
                    break;
                default:
                    query = currentFilter;
            }
        }
        
        // Build URL with parameters
        const params = new URLSearchParams({
            key: PIXABAY_API_KEY,
            q: query,
            image_type: 'photo',
            orientation: 'horizontal',
            per_page: 30,
            safesearch: true,
        });
        
        const response = await fetch(`${PIXABAY_API_URL}?${params}`);
        const data = await response.json();
        
        if (data.hits) {
            // Map API response to our wallpaper format
            wallpapers = data.hits.map((item, index) => ({
                id: item.id,
                title: item.tags.split(',')[0],
                category: determineCategory(item.tags),
                src: item.largeImageURL,
                alt: item.tags,
                user: item.user,
                downloads: item.downloads,
                favorites: item.favorites,
                originalURL: item.pageURL
            }));
            
            renderWallpapers();
        } else {
            showErrorMessage('No wallpapers found. Try a different search term.');
        }
    } catch (error) {
        console.error('Error fetching wallpapers:', error);
        showErrorMessage('Failed to load wallpapers. Please try again later.');
    } finally {
        isLoading = false;
        hideLoadingIndicator();
    }
}

// Determine the most appropriate category based on image tags
function determineCategory(tags) {
    tags = tags.toLowerCase();
    
    if (tags.includes('nature') || tags.includes('landscape') || tags.includes('mountain') || tags.includes('forest')) {
        return 'nature';
    } else if (tags.includes('abstract') || tags.includes('pattern')) {
        return 'abstract';
    } else if (tags.includes('anime') || tags.includes('cartoon') || tags.includes('manga')) {
        return 'anime';
    } else if (tags.includes('space') || tags.includes('galaxy') || tags.includes('universe') || tags.includes('cosmos')) {
        return 'space';
    } else if (tags.includes('minimal') || tags.includes('simple') || tags.includes('minimalist')) {
        return 'minimal';
    } else if (tags.includes('architecture') || tags.includes('building') || tags.includes('city')) {
        return 'architecture';
    } else if (tags.includes('car') || tags.includes('vehicle') || tags.includes('automotive')) {
        return 'cars';
    } else if (tags.includes('animal') || tags.includes('wildlife') || tags.includes('pet')) {
        return 'animals';
    } else if (tags.includes('food') || tags.includes('cuisine') || tags.includes('meal')) {
        return 'food';
    } else if (tags.includes('travel') || tags.includes('destination') || tags.includes('tourism')) {
        return 'travel';
    } else if (tags.includes('technology') || tags.includes('gadget') || tags.includes('digital')) {
        return 'technology';
    } else {
        return 'other';
    }
}

// Render wallpapers based on current filter and search
function renderWallpapers() {
    wallpaperGrid.innerHTML = '';
    
    let filteredWallpapers = [...wallpapers];
    
    // Filter by category if not 'all'
    if (currentFilter !== 'all' && !isShowingFavorites) {
        filteredWallpapers = filteredWallpapers.filter(wallpaper => 
            wallpaper.category === currentFilter
        );
    }
    
    // Filter by favorites if showing favorites
    if (isShowingFavorites) {
        filteredWallpapers = filteredWallpapers.filter(wallpaper => 
            favorites.includes(wallpaper.id)
        );
    }
    
    // Create and append wallpaper cards
    filteredWallpapers.forEach(wallpaper => {
        const isFavorite = favorites.includes(wallpaper.id);
        
        const wallpaperCard = document.createElement('div');
        wallpaperCard.className = 'wallpaper-card';
        wallpaperCard.dataset.id = wallpaper.id;
        
        wallpaperCard.innerHTML = `
            <img class="wallpaper-img" src="${wallpaper.src}" alt="${wallpaper.alt}" loading="lazy">
            <div class="wallpaper-info">
                <div>
                    <h3>${wallpaper.title}</h3>
                    <p>${wallpaper.category}</p>
                </div>
                <i class="fav-icon ${isFavorite ? 'fas' : 'far'} fa-heart ${isFavorite ? 'active' : ''}"></i>
            </div>
        `;
        
        wallpaperGrid.appendChild(wallpaperCard);
    });
    
    // Show message if no wallpapers found
    if (filteredWallpapers.length === 0) {
        wallpaperGrid.innerHTML = `
            <div class="no-results">
                <p>No wallpapers found. Try a different filter or search term.</p>
            </div>
        `;
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Dark mode toggle
    darkModeToggle.addEventListener('change', toggleDarkMode);
    
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isLoading) return; // Prevent multiple concurrent requests
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.category;
            isShowingFavorites = false;
            
            fetchWallpapers(); // Fetch new wallpapers based on selected category
        });
    });
    
    // Search functionality
    searchBtn.addEventListener('click', () => {
        if (isLoading) return;
        const searchTerm = searchInput.value.trim();
        fetchWallpapers(searchTerm);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isLoading) {
            const searchTerm = searchInput.value.trim();
            fetchWallpapers(searchTerm);
        }
    });
    
    // Wallpaper card click to open lightbox
    wallpaperGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.wallpaper-card');
        if (card) {
            const wallpaperId = parseInt(card.dataset.id, 10);
            currentWallpaper = wallpapers.find(w => w.id === wallpaperId);
            
            if (e.target.classList.contains('fav-icon')) {
                toggleFavorite(wallpaperId, e.target);
            } else {
                openLightbox(currentWallpaper);
            }
        }
    });
    
    // Lightbox controls
    closeBtn.addEventListener('click', closeLightbox);
    
    downloadBtn.addEventListener('click', () => {
        if (currentWallpaper) {
            window.open(currentWallpaper.src, '_blank');
        }
    });
    
    favoriteBtn.addEventListener('click', () => {
        if (currentWallpaper) {
            const isFavorite = toggleFavorite(currentWallpaper.id);
            
            // Update the lightbox favorite button
            favoriteBtn.innerHTML = isFavorite 
                ? '<i class="fas fa-heart"></i>' 
                : '<i class="far fa-heart"></i>';
                
            // Also update the card's heart icon
            const card = document.querySelector(`.wallpaper-card[data-id="${currentWallpaper.id}"]`);
            if (card) {
                const heartIcon = card.querySelector('.fav-icon');
                if (isFavorite) {
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas', 'active');
                } else {
                    heartIcon.classList.remove('fas', 'active');
                    heartIcon.classList.add('far');
                }
            }
        }
    });
    
    // Show favorites
    showFavoritesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isShowingFavorites = true;
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        if (favorites.length > 0) {
            renderWallpapers();
        } else {
            wallpaperGrid.innerHTML = `
                <div class="no-results">
                    <p>You haven't added any favorites yet.</p>
                </div>
            `;
        }
    });
    
    // Escape key to close lightbox
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}

// Show loading indicator
function showLoadingIndicator() {
    wallpaperGrid.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading wallpapers...</p>
        </div>
    `;
}

// Hide loading indicator
function hideLoadingIndicator() {
    const loader = document.querySelector('.loading-indicator');
    if (loader) {
        loader.remove();
    }
}

// Show error message
function showErrorMessage(message) {
    wallpaperGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Open lightbox with selected wallpaper
function openLightbox(wallpaper) {
    lightboxImage.src = wallpaper.src;
    lightboxImage.alt = wallpaper.alt;
    
    // Update favorite button state
    const isFavorite = favorites.includes(wallpaper.id);
    favoriteBtn.innerHTML = isFavorite 
        ? '<i class="fas fa-heart"></i>' 
        : '<i class="far fa-heart"></i>';
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling while lightbox is open
}

// Close the lightbox
function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Toggle favorite status for a wallpaper
function toggleFavorite(wallpaperId, heartIcon = null) {
    const index = favorites.indexOf(wallpaperId);
    let isFavorite = false;
    
    if (index === -1) {
        // Add to favorites
        favorites.push(wallpaperId);
        isFavorite = true;
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        isFavorite = false;
    }
    
    // Update UI if heartIcon is provided
    if (heartIcon) {
        if (isFavorite) {
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas', 'active');
        } else {
            heartIcon.classList.remove('fas', 'active');
            heartIcon.classList.add('far');
        }
    }
    
    // Save to localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Update view if showing favorites and removed a favorite
    if (isShowingFavorites && !isFavorite) {
        renderWallpapers();
    }
    
    return isFavorite;
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// Check user's dark mode preference
function checkDarkModePreference() {
    const prefersDarkMode = localStorage.getItem('darkMode') === 'true';
    
    if (prefersDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    } else {
        // Check system preference if no saved preference
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (systemPrefersDark) {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
    }
}

// Initialize the gallery when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGallery); 