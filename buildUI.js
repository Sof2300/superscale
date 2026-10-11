const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { minify: minifyHtml } = require('html-minifier-terser');
const { minify: minifyJs } = require('terser');

const srcDir = path.join(__dirname, 'alldata');
const destDir = path.join(__dirname, 'data');

function formatSize(bytes) {
    return (bytes / 1024).toFixed(2) + ' KB';
}

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

// ------------------------------------------------------------------
// SMART FILE READER: Uses iconv-lite to detect and convert encodings
// and sanitizes invisible/control characters that break JS parsers.
// ------------------------------------------------------------------
function readSmartFile(filePath, fileName) {
    let txt = fs.readFileSync(filePath, 'utf8');
    // Strip BOM if present, remove stray NULLs, normalize CRLF
    if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
    txt = txt.replace(/\u0000/g, '').replace(/\r\n/g, '\n');
    return txt;
}

async function build() {
    try {
        console.log('\n=========================================');
        console.log('🚀 Starting Web UI Build Process...');
        console.log(`📁 Source folder: ${srcDir}`);
        console.log(`📁 Dest folder:   ${destDir}`);
        console.log('=========================================\n');

        const htmlPath = path.join(srcDir, 'index.html');
        let html = readSmartFile(htmlPath, 'index.html');
        const initialHtmlSize = Buffer.byteLength(html, 'utf8');

        const scriptRegex = /<script[^>]*?src=["']([^"']+\.js)["'][^>]*><\/script>/gi;
        let match;
        let combinedJs = '';
        let jsFilesFound = 0;
        let totalOriginalJsBytes = 0;

        console.log('[1/3] Scanning index.html for JavaScript files...');

        while ((match = scriptRegex.exec(html)) !== null) {
            const jsFileName = match[1];
            
            if (jsFileName === 'bundle-min.js') {
                continue; 
            }

            const jsFilePath = path.join(srcDir, jsFileName);
            
            if (fs.existsSync(jsFilePath)) {
                console.log(`  -> Reading: ${jsFileName}`);
                
                let fileContent = readSmartFile(jsFilePath, jsFileName);
                const fileSize = Buffer.byteLength(fileContent, 'utf8');
                totalOriginalJsBytes += fileSize;
                
                console.log(`     Size: ${formatSize(fileSize)}`);
                
                combinedJs += fileContent + ';\n';
                jsFilesFound++;
            } else {
                console.log(`  -> ⚠️ WARNING: Missing file! ${jsFileName}`);
            }
        }

        let finalJsSize = 0;

        console.log('\n[2/3] Processing JavaScript...');
        if (jsFilesFound > 0) {
            console.log(`  -> Bundling ${jsFilesFound} files (Total original size: ${formatSize(totalOriginalJsBytes)})`);
            console.log('  -> Minifying (removing spaces, shortening variables)...');
            
            // FIX: Added format: { ascii_only: true }
            const minifiedJs = await minifyJs(combinedJs, { 
                compress: true, 
                mangle: true,
                format: { ascii_only: true } 
            });
            
            if (minifiedJs.error) {
                throw minifiedJs.error;
            }

            const minJsSize = Buffer.byteLength(minifiedJs.code, 'utf8');
            console.log(`     (Size reduced to: ${formatSize(minJsSize)})`);
            
            console.log('  -> Compressing with GZIP...');
            const gzippedJs = zlib.gzipSync(minifiedJs.code);
            finalJsSize = gzippedJs.length;
            
            fs.writeFileSync(path.join(destDir, 'bundle-min.js.gz'), gzippedJs);
            console.log(`  ✅ Saved data/bundle-min.js.gz (Final size: ${formatSize(finalJsSize)})`);
        } else {
            console.log('  -> No JavaScript files found in index.html to process.');
        }

        console.log('\n[3/3] Processing HTML...');
        console.log(`  -> Original HTML size: ${formatSize(initialHtmlSize)}`);
        
        html = html.replace(scriptRegex, '');
        html = html.replace('</body>', '<script src="bundle-min.js"></script>\n</body>');

        console.log('  -> Minifying HTML...');
        
        // FIX: Passed ascii_only to inline minifyJS
        const minifiedHtml = await minifyHtml(html, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true, 
            minifyJS: { format: { ascii_only: true } }
        });
        
        const minHtmlSize = Buffer.byteLength(minifiedHtml, 'utf8');
        console.log(`     (Size reduced to: ${formatSize(minHtmlSize)})`);

        console.log('  -> Compressing with GZIP...');
        const gzippedHtml = zlib.gzipSync(minifiedHtml);
        const finalHtmlSize = gzippedHtml.length;
        
        fs.writeFileSync(path.join(destDir, 'index.html.gz'), gzippedHtml);
        console.log(`  ✅ Saved data/index.html.gz (Final size: ${formatSize(finalHtmlSize)})`);

        console.log('\n=========================================');
        console.log('🎉 Build Complete!');
        console.log(`📊 Total Flash Space Used: ${formatSize(finalJsSize + finalHtmlSize)}`);
        console.log('=========================================\n');

    } catch (error) {
        console.error('\n❌ Build failed with error:');
        console.error(error);
    }
}

build();