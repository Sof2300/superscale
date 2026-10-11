const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { minify: minifyHtml } = require('html-minifier-terser');
const { minify: minifyJs } = require('terser');

const srcDir = path.join(__dirname, 'alldata', 'viz');
const destDir = path.join(__dirname, 'data', 'viz');

// Get filename from command line argument
const htmlFileName = process.argv[2];

if (!htmlFileName) {
    console.error('Usage: node buildVizFile.js <htmlFileName>');
    console.error('Example: node buildVizFile.js SavedRequests.html');
    process.exit(1);
}

if (!htmlFileName.endsWith('.html')) {
    console.error('Error: File must be an HTML file');
    process.exit(1);
}

// Generate base name from HTML filename (e.g., BlockViz.html -> BlockViz)
const baseName = htmlFileName.replace('.html', '');

function formatSize(bytes) {
    return (bytes / 1024).toFixed(2) + ' KB';
}

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

function readSmartFile(filePath, fileName) {
    let txt = fs.readFileSync(filePath, 'utf8');
    if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
    txt = txt.replace(/\u0000/g, '').replace(/\r\n/g, '\n');
    return txt;
}

function isAlreadyMinified(fileName) {
    return fileName.includes('.min.');
}

async function build() {
    try {
        console.log('\n=========================================');
        console.log(`🚀 Starting ${htmlFileName} Build Process...`);
        console.log(`📁 Source folder: ${srcDir}`);
        console.log(`📁 Dest folder:   ${destDir}`);
        console.log('=========================================\n');

        const htmlPath = path.join(srcDir, htmlFileName);
        
        if (!fs.existsSync(htmlPath)) {
            console.error(`❌ Error: File not found: ${htmlPath}`);
            process.exit(1);
        }
        
        let html = readSmartFile(htmlPath, htmlFileName);
        const initialHtmlSize = Buffer.byteLength(html, 'utf8');

        // Process CSS files
        const cssRegex = /<link[^>]*?href=["']([^"']+\.css)["'][^>]*>/gi;
        let match;
        let cssFileList = [];

        console.log('[1/5] Scanning for CSS files...');

        while ((match = cssRegex.exec(html)) !== null) {
            const cssFileName = match[1];
            const cssFilePath = path.join(srcDir, cssFileName);

            if (fs.existsSync(cssFilePath)) {
                console.log(`  -> Reading: ${cssFileName}`);
                let fileContent = readSmartFile(cssFilePath, cssFileName);
                const fileSize = Buffer.byteLength(fileContent, 'utf8');
                console.log(`     Size: ${formatSize(fileSize)}`);

                if (isAlreadyMinified(cssFileName)) {
                    console.log(`     (Library file - will compress separately)`);
                    cssFileList.push({ name: cssFileName, content: fileContent });
                } else {
                    console.log(`     (Custom file - will keep embedded in HTML)`);
                }
            } else {
                console.log(`  -> ⚠️ WARNING: Missing file! ${cssFileName}`);
            }
        }

        let finalCssSize = 0;
        let finalJsSize = 0;

        // Compress library CSS files separately
        for (let cssFile of cssFileList) {
            console.log(`  -> Compressing ${cssFile.name}...`);
            const gzipped = zlib.gzipSync(cssFile.content);
            finalCssSize += gzipped.length;
            fs.writeFileSync(path.join(destDir, cssFile.name + '.gz'), gzipped);
            console.log(`     Saved data/viz/${cssFile.name}.gz (${formatSize(gzipped.length)})`);
        }

        // Process shared JS file (BlockVizDataProcess.js) separately since it's shared across all HTML files
        const sharedJsFile = 'BlockVizDataProcess.js';
        const sharedJsRegex = new RegExp(`<script[^>]*?src=["']${sharedJsFile}["'][^>]*></script>`, 'gi');
        if (sharedJsRegex.test(html)) {
            console.log(`\n  -> Found shared file: ${sharedJsFile}`);
            const sharedJsPath = path.join(srcDir, sharedJsFile);
            if (fs.existsSync(sharedJsPath)) {
                let fileContent = readSmartFile(sharedJsPath, sharedJsFile);
                const fileSize = Buffer.byteLength(fileContent, 'utf8');
                console.log(`     Original size: ${formatSize(fileSize)}`);
                console.log(`  -> Minifying ${sharedJsFile}...`);

                let minifiedJs;
                try {
                    minifiedJs = await minifyJs(fileContent, {
                        compress: true,
                        mangle: false,
                        format: { ascii_only: true }
                    });
                } catch (e) {
                    console.log(`  -> ⚠️  Minification failed, compressing without minification...`);
                    const gzippedJs = zlib.gzipSync(fileContent);
                    finalJsSize += gzippedJs.length;
                    fs.writeFileSync(path.join(destDir, sharedJsFile + '.gz'), gzippedJs);
                    console.log(`  ✅ Saved data/viz/${sharedJsFile}.gz (Final size: ${formatSize(gzippedJs.length)})`);
                }

                if (minifiedJs) {
                    if (minifiedJs.error) {
                        throw minifiedJs.error;
                    }

                    const minJsSize = Buffer.byteLength(minifiedJs.code, 'utf8');
                    console.log(`     (Size reduced to: ${formatSize(minJsSize)})`);

                    console.log(`  -> Compressing ${sharedJsFile}...`);
                    const gzippedJs = zlib.gzipSync(minifiedJs.code);
                    finalJsSize += gzippedJs.length;

                    fs.writeFileSync(path.join(destDir, sharedJsFile + '.gz'), gzippedJs);
                    console.log(`  ✅ Saved data/viz/${sharedJsFile}.gz (Final size: ${formatSize(gzippedJs.length)})`);
                }

                // Replace the script reference in HTML to point to the .gz file
                html = html.replace(sharedJsRegex, `<script src="${sharedJsFile}.gz"></script>`);
                console.log(`  -> Updated HTML to reference ${sharedJsFile}.gz`);
            }
        }

        // Process JavaScript files
        const scriptRegex = /<script[^>]*?src=["']([^"']+\.js)["'][^>]*><\/script>/gi;
        let jsFileList = [];

        console.log('\n[2/5] Scanning for JavaScript files...');

        while ((match = scriptRegex.exec(html)) !== null) {
            const jsFileName = match[1];

            if (jsFileName === 'bundle-min.js' || jsFileName === sharedJsFile) {
                continue;
            }

            const jsFilePath = path.join(srcDir, jsFileName);

            if (fs.existsSync(jsFilePath)) {
                console.log(`  -> Reading: ${jsFileName}`);
                let fileContent = readSmartFile(jsFilePath, jsFileName);
                const fileSize = Buffer.byteLength(fileContent, 'utf8');
                console.log(`     Size: ${formatSize(fileSize)}`);

                if (isAlreadyMinified(jsFileName)) {
                    console.log(`     (Library file - will compress separately)`);
                    jsFileList.push({ name: jsFileName, content: fileContent });
                } else {
                    console.log(`     (Custom file - will keep embedded in HTML)`);
                }
            } else {
                console.log(`  -> ⚠️ WARNING: Missing file! ${jsFileName}`);
            }
        }

        // Compress library JS files separately
        for (let jsFile of jsFileList) {
            console.log(`  -> Compressing ${jsFile.name}...`);
            const gzipped = zlib.gzipSync(jsFile.content);
            finalJsSize += gzipped.length;
            fs.writeFileSync(path.join(destDir, jsFile.name + '.gz'), gzipped);
            console.log(`     Saved data/viz/${jsFile.name}.gz (${formatSize(gzipped.length)})`);
        }

        console.log('\n[3/5] Skipping custom JavaScript processing (kept embedded in HTML)...');

        console.log('\n[4/5] Processing HTML...');
        console.log(`  -> Original HTML size: ${formatSize(initialHtmlSize)}`);

        console.log('  -> Minifying HTML with embedded CSS and scripts...');

        const minifiedHtml = await minifyHtml(html, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: { format: { ascii_only: true } },
            removeEmptyAttributes: true,
            removeOptionalTags: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true
        });

        const minHtmlSize = Buffer.byteLength(minifiedHtml, 'utf8');
        console.log(`     (Size reduced to: ${formatSize(minHtmlSize)})`);

        console.log('  -> Compressing with GZIP...');
        const gzippedHtml = zlib.gzipSync(minifiedHtml);
        const finalHtmlSize = gzippedHtml.length;

        fs.writeFileSync(path.join(destDir, htmlFileName + '.gz'), gzippedHtml);
        console.log(`  ✅ Saved data/viz/${htmlFileName}.gz (Final size: ${formatSize(finalHtmlSize)})`);

        console.log('\n=========================================');
        console.log('🎉 Build Complete!');
        console.log(`📊 Total Flash Space Used: ${formatSize(finalCssSize + finalJsSize + finalHtmlSize)}`);
        console.log('=========================================\n');

    } catch (error) {
        console.error('\n❌ Build failed with error:');
        console.error(error);
        process.exit(1);
    }
}

build();
