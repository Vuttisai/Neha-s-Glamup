const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const path = require('path');

const rootPath = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(rootPath, 'jewelry.html'), 'utf8');

const dom = new JSDOM(html, {
    url: "http://localhost:3000/jewelry.html",
    runScripts: "dangerously",
    resources: "usable"
});

dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// Mock config, products, and script by injecting them
const configCode = fs.readFileSync(path.join(rootPath, 'config.js'), 'utf8');
const productsCode = fs.readFileSync(path.join(rootPath, 'products.js'), 'utf8').replace(/const /g, 'var ');
const scriptCode = fs.readFileSync(path.join(rootPath, 'jewelry-script.js'), 'utf8').replace(/let jewelryData/g, 'window.jewelryData').replace(/let activeCategory/g, 'window.activeCategory');

dom.window.eval(configCode);
dom.window.eval(productsCode);
dom.window.eval(scriptCode);

setTimeout(() => {
    // Explicitly call renderGrid in case DOMContentLoaded was missed
    dom.window.eval("renderGrid()");
    
    const grid = dom.window.document.getElementById('jewelry-grid');
    const cards = grid.querySelectorAll('.product-card');
    console.log("Number of cards rendered:", cards.length);
    console.log("jewelryData length:", dom.window.jewelryData.length);
    
    // Check if empty state is visible
    const emptyState = dom.window.document.getElementById('empty-state');
    console.log("Empty state hidden?", emptyState.classList.contains('hidden'));
    
    // Print any errors
    console.log("Errors if any:");
}, 1000);
