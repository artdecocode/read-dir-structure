const { lstat, readdir } = require('fs');
const makePromise = require('makepromise');
const { join, relative } = require('path');

/**
 * Update information about directory's content with lstat.
 * @param {string} dirPath Path to the root directory
 * @param {!Array<string>} dirContent
 * @returns {Promise<Array<_wrote.File>>} An array with file objects.
 */
async function lstatFiles(dirPath, dirContent) {
  const readFiles = dirContent.map(async (relativePath) => {
    const path = join(dirPath, relativePath)
    const ls = await makePromise(lstat, path)
    return {
      lstat: ls,
      path,
      relativePath,
    }
  })
  const res = await Promise.all(readFiles)
  return res
}

/**
 * Check if lstat result is a directory
 * @param {_wrote.File} lstatRes
 * @param {!fs.Stats} lstatRes.lstat The stats of the item.
 * @param {string} lstatRes.path The full path of the item.
 * @param {string} lstatRes.relativePath The name of the item.
 * @returns {boolean} true if is a directory
 */
const isDirectory = lstatRes => lstatRes.lstat.isDirectory()
/**
 * Check if lstat result is not a directory
 * @param {_wrote.File} lstatRes
 * @param {!fs.Stats} lstatRes.lstat The stats of the item.
 * @param {string} lstatRes.path The full path of the item.
 * @param {string} lstatRes.relativePath The name of the item.
 * @returns {boolean} true if is not a directory
 */
const isNotDirectory = lstatRes => !lstatRes.lstat.isDirectory()

const getType = (lstatRes) => {
  if (lstatRes.lstat.isDirectory()) {
    return 'Directory'
  }
  if (lstatRes.lstat.isFile()) {
    return 'File'
  }
  if (lstatRes.lstat.isSymbolicLink()) {
    return 'SymbolicLink'
  }
}

/**
 * Read a directory, and return its structure as an object. Only `Files`, `Directories` and `Symlinks` are included!
 * @param {string} dirPath Path to the directory.
 * @param {!_wrote.ReadDirStructureOpts} [opts] The options.
 * @returns {!Promise<_wrote.DirectoryStructure>} An object reflecting the directory structure.
 * @example
  ```js
  const res = await readDirStructure('dir')
  // result:
  {
    type: 'Directory',
    content: {
      'data.txt': {
        type: 'File'
      },
      subdir: {
        type: 'Directory',
        content: {
          'data-ln.txt': {
            type: 'SymbolicLink'
          },
        }
      }
    }
  }
  ```
 */
async function readDirStructure(dirPath, opts = {}) {
  if (!dirPath) {
    throw new Error('Please specify a path to the directory')
  }
  const { ignore = [] } = opts
  const ls = await makePromise(lstat, dirPath)
  if (!ls.isDirectory()) {
    const err = new Error('Path is not a directory')
    err.code = 'ENOTDIR'
    throw err
  }
  const dir = /** @type {!Array<string>} */ (await makePromise(readdir, dirPath))
  const lsr = await lstatFiles(dirPath, dir)

  const directories = lsr.filter(isDirectory) // reduce at once
  const notDirectories = lsr.filter(isNotDirectory)

  const files = notDirectories.reduce((acc, current) => {
    const type = getType(current)
    return {
      ...acc,
      [current.relativePath]: {
        type,
      },
    }
  }, {})

  const dirs = await directories.reduce(async (acc, { path, relativePath }) => {
    const rel = relative(dirPath, path)
    if (ignore.includes(rel)) return acc
    const res = await acc
    const structure = await readDirStructure(path)
    return {
      ...res,
      [relativePath]: structure,
    }
  }, {})

  const content = {
    ...files,
    ...dirs,
  }
  return {
    content,
    type: 'Directory',
  }
}

/**
 * After running the `readDirStructure`, this function can be used to flatten the `content` output and return the list of all files (not including symlinks).
 * @param {!_wrote.Content} content The recursive content of the directory.
 * @param {string} path The path to the directory.
 */
const getFiles = (content, path) => {
  let files = []
  let dirs = []
  Object.keys(content).forEach((key) => {
    const { type } = content[key]
    if (type == 'File') files.push(join(path, key))
    else if (type == 'Directory') dirs.push(key)
  })
  const dirFiles = dirs.reduce((acc, dir) => {
    const { content: c } =
      /** @type {!_wrote.Content} */ (content[dir])
    const f = getFiles(c, join(path, dir))
    return [...acc, ...f]
  }, [])
  return [...files, ...dirFiles]
}

/* typal types/index.xml */
/**
 * @suppress {nonStandardJsDocs}
 * @typedef {_wrote.File} File
 */
/**
 * @suppress {nonStandardJsDocs}
 * @typedef {Object} _wrote.File
 * @prop {!fs.Stats} lstat The stats of the item.
 * @prop {string} path The full path of the item.
 * @prop {string} relativePath The name of the item.
 */
/**
 * @suppress {nonStandardJsDocs}
 * @typedef {_wrote.ReadDirStructureOpts} ReadDirStructureOpts Options for reading the dir structure.
 */
/**
 * @suppress {nonStandardJsDocs}
 * @typedef {Object} _wrote.ReadDirStructureOpts Options for reading the dir structure.
 * @prop {!Array<string>} [ignore] The list of paths inside of the directory to ignore, e.g., `[.git]`.
 */
/**
 * @suppress {nonStandardJsDocs}
 * @typedef {_wrote.Content} Content The recursive content of the directory.
 */
/**
 * @suppress {nonStandardJsDocs}
 * @typedef {Object<string, !_wrote.DirectoryStructure>} _wrote.Content The recursive content of the directory.
 */
/**
 * @suppress {nonStandardJsDocs}
 * @typedef {_wrote.DirectoryStructure} DirectoryStructure A directory structure representation.
 */
/**
 * @suppress {nonStandardJsDocs}
 * @typedef {Object} _wrote.DirectoryStructure A directory structure representation.
 * @prop {string} [type] The type of the item.
 * @prop {!_wrote.Content} [content] The recursive content if the item is a directory.
 */
/**
 * @suppress {nonStandardJsDocs}
 * @typedef {import('fs').Stats} fs.Stats
 */


module.exports = readDirStructure
module.exports.getFiles = getFiles