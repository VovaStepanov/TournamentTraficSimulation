function removeFromList(list, item) {
    list.splice(list.indexOf(item), 1);
}

function getLineLength(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx*dx + dy*dy);
}

function findAllPaths(start, end, currentPath) {
    let path = currentPath.slice();
    path.push(start);
    if (start === end) {
        return [path];
    }
    let paths = [];
    for (let i = 0; i < start.connections.length; i++) {
        let node = start.connections[i];
        if (path.indexOf(node) === -1) {
            let newPaths = findAllPaths(node, end, path);
            for (let j = 0; j < newPaths.length; j++) {
                paths.push(newPaths[j]);
            }
        }
    }
    return paths;
}

function getMinPath(paths) {
    let minPath = null;
    let minDistance = 0;
    for (let i=0; i < paths.length; i++) {
        let path = paths[i];
        let distance = 0;
        for (let j=0; j < path.length - 1; j++) {
            distance += path[j].distances[path[j+1].index];
        }
        if (!minDistance || distance < minDistance) {
            minDistance = distance;
            minPath = path;
        }
    }
    return minPath;
}


function randomInteger(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}