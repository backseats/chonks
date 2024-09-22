import xml2js from 'xml2js';

function hexToBytes(hex) {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}

function bytesToHex(bytes) {
    return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function parseSvgToBytes(svgString) {
    let bytes = [];
    const parser = new xml2js.Parser();

    parser.parseString(svgString, (err, result) => {
        if (err) {
            throw new Error('Error parsing SVG');
        }

        if (!result.svg) {
            throw new Error('Invalid SVG format');
        }

        // Function to recursively find all <rect> elements
        function findRects(node) {
            if (Array.isArray(node.rect)) {
                node.rect.forEach(rect => {
                    const x = parseInt(rect.$.x, 10);
                    const y = parseInt(rect.$.y, 10);
                    const fill = rect.$.fill.replace('#', '');
                    bytes.push(x);
                    bytes.push(y);
                    bytes.push(...hexToBytes(fill));
                });
            }
            Object.values(node).forEach(child => {
                if (Array.isArray(child) && child.length > 0 && typeof child[0] === 'object') {
                    child.forEach(findRects);
                }
            });
        }

        findRects(result.svg);
    });

    return bytesToHex(bytes);
}
