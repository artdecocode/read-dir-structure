# @wrote/read-dir-structure

[![npm version](https://badge.fury.io/js/@wrote/read-dir-structure.svg)](https://badge.fury.io/js/@wrote/read-dir-structure)

`@wrote/read-dir-structure` is Node.js package to a read directory structure.

```sh
yarn add -E @wrote/read-dir-structure
```

## Table Of Contents

%TOC%

## API

There is a single default export function, import it with the following statement:

```js
import readDirStructure from '@wrote/read-dir-structure
```

### `Structure` Type

The return type of the function is a directory `Structure`. It is an associative array which contains the next properties:

```table
[
  ["Property", "Type", "Description"],
  ["type", "`string`", "The result of the _lstat_ and One of the following: `Directory`, `File`, `SymbolicLink`"],
  ["content", "`Structure`", "If the type is `Directory`, the object will also have a `content` which also is a `Structure`. Therefore, the whole nested structure will be read. See below for an example."]
]
```


```### async readDirStructure => Structure
[
  ["path", "string"]
]
```

Reads the structure of the directory.

%EXAMPLE: example/example.js, ../src => @wrote/read-dir-structure, javascript%

Output for the [`example/directory`](example/directory):

```json
{
  "content": {
    "fileA.txt": {
      "type": "File"
    },
    "fileB.txt": {
      "type": "File"
    },
    "fileC.txt": {
      "type": "File"
    },
    "test.json": {
      "type": "File"
    },
    "d": {
      "subdirectory": {
        "content": {
          "subdirFileA.txt": {
            "type": "File"
          },
          "subdirFileB.txt": {
            "type": "File"
          }
        },
        "type": "Directory"
      }
    }
  },
  "type": "Directory"
}
```

### Errors

```table
[
  ["code", "Message"],
  []
]
```

---

(c) [Art Deco Code][1] 2018

[1]: https://artdeco.bz