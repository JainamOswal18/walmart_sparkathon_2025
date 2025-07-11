// content.js - Injected into grocery sites, handles DOM actions and observation

// Keep track of the extension's state
let isExtensionActive = false;
let agentElementPrefix = 'agent-id-';
let elementRegistry = new Map(); // Maps agent-ids to actual DOM elements

// Listen for messages from the extension popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "EXECUTE_COMMAND") {
    executeCommand(message.command, message.parameters)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  } else if (message.action === "CHECK_STATUS") {
    sendResponse({ active: isExtensionActive });
  } else if (message.action === "OBSERVE_PAGE") {
    observePage()
      .then(pageData => sendResponse({ success: true, pageData }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
  return true;
});

/**
 * Observe the current page and create a simplified representation of interactive elements
 * @returns {Promise<Object>} JSON representation of the page
 */
async function observePage() {
  console.log("Observing page...");
  
  // Clear previous element registry
  elementRegistry.clear();
  
  // Get page metadata
  const pageData = {
    url: window.location.href,
    title: document.title,
    interactive_elements: []
  };
  
  // Find all interactive elements
  const interactiveSelectors = [
    'button', 
    'a', 
    'input', 
    'select', 
    'textarea', 
    '[role="button"]', 
    '[role="link"]', 
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[tabindex="0"]'
  ];
  
  const elements = document.querySelectorAll(interactiveSelectors.join(','));
  let idCounter = 1;
  
  elements.forEach(element => {
    // Skip hidden elements or those without meaningful interaction
    if (isElementHidden(element)) return;
    
    // Create a unique ID for this element
    const agentId = `${agentElementPrefix}${idCounter++}`;
    
    // Store reference to the actual DOM element
    elementRegistry.set(agentId, element);
    
    // Create a simplified representation of this element
    const elementData = {
      id: agentId,
      type: getElementType(element),
      text: getElementText(element),
      attributes: getElementAttributes(element),
      location: getElementLocation(element),
      isVisible: isElementVisible(element)
    };
    
    pageData.interactive_elements.push(elementData);
  });
  
  // Add form fields that might not be captured above
  const formFields = document.querySelectorAll('form input, form select, form textarea');
  formFields.forEach(field => {
    // Skip if already processed or hidden
    if (isElementHidden(field) || Array.from(elementRegistry.values()).includes(field)) return;
    
    const agentId = `${agentElementPrefix}${idCounter++}`;
    elementRegistry.set(agentId, field);
    
    const elementData = {
      id: agentId,
      type: getElementType(field),
      text: getElementText(field),
      attributes: getElementAttributes(field),
      location: getElementLocation(field),
      isVisible: isElementVisible(field)
    };
    
    pageData.interactive_elements.push(elementData);
  });
  
  console.log("Page observation complete:", pageData);
  return pageData;
}

/**
 * Get the element type (button, link, input, etc.)
 */
function getElementType(element) {
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'input') {
    return `input-${element.type || 'text'}`;
  }
  
  if (element.getAttribute('role')) {
    return `${tagName}-${element.getAttribute('role')}`;
  }
  
  return tagName;
}

/**
 * Get the visible text of an element
 */
function getElementText(element) {
  // For inputs, return placeholder or value
  if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
    return element.placeholder || element.value || '';
  }
  
  // For other elements, return trimmed text content
  return element.innerText?.trim() || '';
}

/**
 * Get important attributes of an element
 */
function getElementAttributes(element) {
  const attributes = {};
  
  // Common attributes that help identify elements
  const importantAttrs = [
    'id', 'name', 'class', 'href', 'placeholder', 'aria-label', 
    'title', 'alt', 'value', 'type', 'role', 'data-testid'
  ];
  
  importantAttrs.forEach(attr => {
    if (element.hasAttribute(attr)) {
      attributes[attr] = element.getAttribute(attr);
    }
  });
  
  return attributes;
}

/**
 * Get the location of an element on the page
 */
function getElementLocation(element) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
    viewportX: rect.left,
    viewportY: rect.top,
    isInViewport: isInViewport(rect)
  };
}

/**
 * Check if an element is in the current viewport
 */
function isInViewport(rect) {
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Check if an element is hidden
 */
function isElementHidden(element) {
  const style = window.getComputedStyle(element);
  return style.display === 'none' || 
         style.visibility === 'hidden' || 
         style.opacity === '0' ||
         element.offsetParent === null;
}

/**
 * Check if an element is visible
 */
function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && !isElementHidden(element);
}

/**
 * Execute commands received from the backend
 * @param {string} command - The command to execute
 * @param {Object} parameters - Command parameters
 * @returns {Promise<Object>} Result of the command execution
 */
async function executeCommand(command, parameters = {}) {
  console.log(`Executing command: ${command}`, parameters);
  
  try {
    switch (command) {
      case "click":
        return await clickElement(parameters.selector);
      
      case "type":
        return await typeInElement(parameters.selector, parameters.text);
      
      case "scroll":
        return await scrollPage(parameters.direction, parameters.amount);
      
      case "stop":
        return { status: "completed", message: "Task completed successfully" };
      
      // Legacy commands for backward compatibility
      case "search_product":
        return await searchProduct(parameters.query);
      
      case "add_to_cart":
        return await addToCart(parameters.productId || parameters.productName);
      
      case "view_cart":
        return await viewCart();
      
      case "navigate_to":
        return await navigateTo(parameters.url || parameters.section);
      
      case "filter_products":
        return await filterProducts(parameters.filters);
      
      case "select_product":
        return await selectProduct(parameters.productId || parameters.productIndex || parameters.productName);
      
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`Error executing command ${command}:`, error);
    throw error;
  }
}

/**
 * Click on an element identified by agent-id
 */
async function clickElement(selector) {
  if (!selector) throw new Error("No selector provided for click action");
  
  const element = findElement(selector);
  if (!element) throw new Error(`Element not found: ${selector}`);
  
  // Scroll element into view if needed
  if (!isInViewport(element.getBoundingClientRect())) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    // Wait a moment for the scroll to complete
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Highlight the element briefly before clicking
  const originalOutline = element.style.outline;
  element.style.outline = '2px solid #4285f4';
  
  // Wait a moment to show the highlight
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Perform the click
  element.click();
  
  // Restore original outline after a short delay
  setTimeout(() => {
    element.style.outline = originalOutline;
  }, 500);
  
  return { status: "success", message: `Clicked element: ${selector}` };
}

/**
 * Type text into an input element
 */
async function typeInElement(selector, text) {
  if (!selector) throw new Error("No selector provided for type action");
  if (!text) throw new Error("No text provided for type action");
  
  const element = findElement(selector);
  if (!element) throw new Error(`Element not found: ${selector}`);
  
  // Check if element is an input or has contentEditable
  const isInput = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
  const isEditable = element.isContentEditable;
  
  if (!isInput && !isEditable) {
    throw new Error(`Element is not an input field: ${selector}`);
  }
  
  // Focus the element
  element.focus();
  
  // Clear existing content
  if (isInput) {
    element.value = '';
  } else if (isEditable) {
    element.textContent = '';
  }
  
  // Type the text character by character to simulate real typing
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (isInput) {
      element.value += char;
    } else if (isEditable) {
      element.textContent += char;
    }
    
    // Dispatch events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
    element.dispatchEvent(new KeyboardEvent('keypress', { key: char }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
    
    // Small delay between characters for more natural typing
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  
  // Dispatch change event after typing is complete
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  return { status: "success", message: `Typed "${text}" into element: ${selector}` };
}

/**
 * Scroll the page
 */
async function scrollPage(direction, amount = 'medium') {
  const scrollAmounts = {
    small: 200,
    medium: 500,
    large: 1000,
    page: window.innerHeight
  };
  
  const scrollAmount = scrollAmounts[amount] || scrollAmounts.medium;
  
  if (direction === 'up') {
    window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
  } else if (direction === 'down') {
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  } else if (direction === 'left') {
    window.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else if (direction === 'right') {
    window.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  } else if (direction === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (direction === 'bottom') {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  } else {
    throw new Error(`Invalid scroll direction: ${direction}`);
  }
  
  // Wait for scroll to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { status: "success", message: `Scrolled ${direction}` };
}

/**
 * Find an element by agent-id or CSS selector
 */
function findElement(selector) {
  // Check if this is an agent-id
  if (selector.startsWith(agentElementPrefix)) {
    return elementRegistry.get(selector);
  }
  
  // Otherwise, treat as a CSS selector
  return document.querySelector(selector);
}

// Search for a product
async function searchProduct(query) {
  if (!query) throw new Error("No search query provided");
  
  // Try to find the search input field
  const searchInputs = [
    document.querySelector('input[type="search"]'),
    document.querySelector('input[placeholder*="search" i]'),
    document.querySelector('input[aria-label*="search" i]'),
    document.querySelector('#search-input'),
    document.querySelector('[name="search"]'),
    // Add more selectors as needed for different grocery sites
  ].filter(Boolean);
  
  if (searchInputs.length === 0) {
    throw new Error("Could not find search input field");
  }
  
  const searchInput = searchInputs[0];
  searchInput.value = query;
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Try to find and click the search button
  return new Promise((resolve, reject) => {
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
        resolve({ status: "success", message: `Searched for "${query}"` });
      } else {
        // If no button found, try to submit the form
        const form = searchInput.closest('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
          resolve({ status: "success", message: `Searched for "${query}" by form submission` });
        } else {
          // If no form, try pressing Enter
          searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          resolve({ status: "success", message: `Searched for "${query}" by pressing Enter` });
        }
      }
    }, 300);
  });
}

// Add a product to the cart
async function addToCart(productIdentifier) {
  if (!productIdentifier) throw new Error("No product identifier provided");
  
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
    return { status: "success", message: `Added "${productIdentifier}" to cart` };
  }
  
  throw new Error(`Could not find add to cart button for "${productIdentifier}"`);
}

// Navigate to the cart page
async function viewCart() {
  const cartLinks = [
    document.querySelector('a[href*="cart" i]'),
    document.querySelector('a[aria-label*="cart" i]'),
    document.querySelector('button[aria-label*="cart" i]'),
    // Add more selectors as needed
  ].filter(Boolean);
  
  if (cartLinks.length > 0) {
    cartLinks[0].click();
    return { status: "success", message: "Navigated to cart" };
  }
  
  throw new Error("Could not find cart link or button");
}

// Navigate to a specific URL or section
async function navigateTo(destination) {
  if (!destination) throw new Error("No destination provided");
  
  // If it's a URL, navigate directly
  if (destination.startsWith('http') || destination.startsWith('/')) {
    window.location.href = destination;
    return { status: "success", message: `Navigating to ${destination}` };
  }
  
  // Otherwise, try to find a matching navigation element
  const navLinks = Array.from(document.querySelectorAll('nav a, header a, .navigation a'))
    .filter(link => link.textContent.toLowerCase().includes(destination.toLowerCase()));
  
  if (navLinks.length > 0) {
    navLinks[0].click();
    return { status: "success", message: `Navigated to ${destination} section` };
  }
  
  throw new Error(`Could not find navigation element for "${destination}"`);
}

// Apply filters to product list
async function filterProducts(filters) {
  if (!filters || typeof filters !== 'object') throw new Error("Invalid filters provided");
  
  // Implementation depends heavily on the specific grocery website
  // This is a simplified example
  const results = [];
  
  for (const [filterName, filterValue] of Object.entries(filters)) {
    // Try to find filter elements
    const filterElements = Array.from(document.querySelectorAll('.filter, .refinement, [data-filter]'))
      .filter(el => el.textContent.toLowerCase().includes(filterName.toLowerCase()));
    
    if (filterElements.length > 0) {
      // Click to expand filter section if needed
      filterElements[0].click();
      
      // Try to find the specific filter value
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const filterOptions = Array.from(document.querySelectorAll('input[type="checkbox"], input[type="radio"]'))
        .filter(input => {
          const label = input.labels?.[0] || input.closest('label');
          return label && label.textContent.toLowerCase().includes(filterValue.toLowerCase());
        });
      
      if (filterOptions.length > 0) {
        filterOptions[0].click();
        results.push(`Applied filter: ${filterName}=${filterValue}`);
      } else {
        results.push(`Could not find value "${filterValue}" for filter "${filterName}"`);
      }
    } else {
      results.push(`Could not find filter "${filterName}"`);
    }
  }
  
  return { status: "success", message: results.join('; ') };
}

// Select a specific product from search results
async function selectProduct(identifier) {
  if (!identifier) throw new Error("No product identifier provided");
  
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
    return { status: "success", message: `Selected product: ${identifier}` };
  }
  
  throw new Error(`Could not find product: ${identifier}`);
} 