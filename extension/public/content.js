// content.js - Injected into grocery sites, handles DOM actions

// Keep track of the extension's state
let isExtensionActive = false;

// Listen for messages from the extension popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "EXECUTE_COMMAND") {
    executeCommand(message.command, message.parameters);
    sendResponse({ success: true });
  } else if (message.action === "CHECK_STATUS") {
    sendResponse({ active: isExtensionActive });
  }
  return true;
});

// Execute commands received from the LiveKit agent
function executeCommand(command, parameters = {}) {
  console.log(`Executing command: ${command}`, parameters);
  
  switch (command) {
    case "search_product":
      searchProduct(parameters.query);
      break;
    case "add_to_cart":
      addToCart(parameters.productId || parameters.productName);
      break;
    case "view_cart":
      viewCart();
      break;
    case "navigate_to":
      navigateTo(parameters.url || parameters.section);
      break;
    case "filter_products":
      filterProducts(parameters.filters);
      break;
    case "select_product":
      selectProduct(parameters.productId || parameters.productIndex || parameters.productName);
      break;
    default:
      console.warn("Unknown command:", command);
  }
}

// Search for a product
function searchProduct(query) {
  if (!query) return;
  
  // Try to find the search input field
  const searchInputs = [
    document.querySelector('input[type="search"]'),
    document.querySelector('input[placeholder*="search" i]'),
    document.querySelector('input[aria-label*="search" i]'),
    document.querySelector('#search-input'),
    document.querySelector('[name="search"]'),
    // Add more selectors as needed for different grocery sites
  ].filter(Boolean);
  
  if (searchInputs.length > 0) {
    const searchInput = searchInputs[0];
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Try to find and click the search button
    setTimeout(() => {
      const searchButtons = [
        document.querySelector('button[type="submit"]'),
        document.querySelector('button[aria-label*="search" i]'),
        document.querySelector('#search-btn'),
        document.querySelector('.search-btn'),
        // Add more selectors as needed
      ].filter(Boolean);
      
      if (searchButtons.length > 0) {
        searchButtons[0].click();
      } else {
        // If no button found, try to submit the form
        const form = searchInput.closest('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }
    }, 300);
  }
}

// Add a product to the cart
function addToCart(productIdentifier) {
  if (!productIdentifier) return;
  
  // Try different strategies to find the add to cart button
  const addToCartButtons = [
    // By product ID if available
    ...(typeof productIdentifier === 'string' && !isNaN(productIdentifier) 
      ? Array.from(document.querySelectorAll(`[data-product-id="${productIdentifier}"] button`)) 
      : []),
    // By product name
    ...Array.from(document.querySelectorAll('.product-card, .product-item, [data-product]'))
      .filter(card => {
        const titleElement = card.querySelector('.product-title, .product-name, h2, h3');
        return titleElement && titleElement.textContent.toLowerCase().includes(productIdentifier.toLowerCase());
      })
      .map(card => card.querySelector('button:not([disabled])')),
    // Generic add to cart buttons if on a product page
    document.querySelector('button:not([disabled])[aria-label*="add to cart" i]'),
    document.querySelector('button:not([disabled])[title*="add to cart" i]'),
    document.querySelector('button:not([disabled]):contains("Add to Cart")'),
    document.querySelector('button:not([disabled]):contains("Add to Bag")'),
    // Add more selectors as needed
  ].filter(Boolean);
  
  if (addToCartButtons.length > 0) {
    addToCartButtons[0].click();
    return true;
  }
  
  return false;
}

// Navigate to the cart page
function viewCart() {
  const cartLinks = [
    document.querySelector('a[href*="cart" i]'),
    document.querySelector('a[aria-label*="cart" i]'),
    document.querySelector('button[aria-label*="cart" i]'),
    // Add more selectors as needed
  ].filter(Boolean);
  
  if (cartLinks.length > 0) {
    cartLinks[0].click();
    return true;
  }
  
  return false;
}

// Navigate to a specific URL or section
function navigateTo(destination) {
  if (!destination) return false;
  
  // If it's a URL, navigate directly
  if (destination.startsWith('http') || destination.startsWith('/')) {
    window.location.href = destination;
    return true;
  }
  
  // Otherwise, try to find a matching navigation element
  const navLinks = Array.from(document.querySelectorAll('nav a, header a, .navigation a'))
    .filter(link => link.textContent.toLowerCase().includes(destination.toLowerCase()));
  
  if (navLinks.length > 0) {
    navLinks[0].click();
    return true;
  }
  
  return false;
}

// Apply filters to product list
function filterProducts(filters) {
  if (!filters || typeof filters !== 'object') return false;
  
  // Implementation depends heavily on the specific grocery website
  // This is a simplified example
  Object.entries(filters).forEach(([filterName, filterValue]) => {
    // Try to find filter elements
    const filterElements = Array.from(document.querySelectorAll('.filter, .refinement, [data-filter]'))
      .filter(el => el.textContent.toLowerCase().includes(filterName.toLowerCase()));
    
    if (filterElements.length > 0) {
      // Click to expand filter section if needed
      filterElements[0].click();
      
      // Try to find the specific filter value
      setTimeout(() => {
        const filterOptions = Array.from(document.querySelectorAll('input[type="checkbox"], input[type="radio"]'))
          .filter(input => {
            const label = input.labels?.[0] || input.closest('label');
            return label && label.textContent.toLowerCase().includes(filterValue.toLowerCase());
          });
        
        if (filterOptions.length > 0) {
          filterOptions[0].click();
        }
      }, 300);
    }
  });
  
  return true;
}

// Select a specific product from search results
function selectProduct(identifier) {
  if (!identifier) return false;
  
  let productElement = null;
  
  // Try to find by index (e.g., "first product", "second product")
  if (typeof identifier === 'string' && /^(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)$/i.test(identifier)) {
    const index = {
      'first': 0, '1st': 0,
      'second': 1, '2nd': 1,
      'third': 2, '3rd': 2,
      'fourth': 3, '4th': 3,
      'fifth': 4, '5th': 4
    }[identifier.toLowerCase()];
    
    const productElements = document.querySelectorAll('.product-card, .product-item, [data-product]');
    if (productElements.length > index) {
      productElement = productElements[index];
    }
  } 
  // Try to find by product name
  else if (typeof identifier === 'string') {
    const productElements = Array.from(document.querySelectorAll('.product-card, .product-item, [data-product]'));
    productElement = productElements.find(el => {
      const titleElement = el.querySelector('.product-title, .product-name, h2, h3');
      return titleElement && titleElement.textContent.toLowerCase().includes(identifier.toLowerCase());
    });
  }
  
  if (productElement) {
    // Try to find the product link or image to click
    const clickableElement = 
      productElement.querySelector('a') || 
      productElement.querySelector('img') || 
      productElement;
    
    clickableElement.click();
    return true;
  }
  
  return false;
} 