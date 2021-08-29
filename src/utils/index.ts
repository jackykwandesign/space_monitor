import * as fs from 'fs'
import { join } from 'path';

export const orderReccentFiles = (dir, isReverse?:boolean) => {
    if(isReverse){
        return fs.readdirSync(dir)
        .filter((file) => fs.lstatSync(join(dir, file)).isFile())
        .map((file) => ({ file, mtime: fs.lstatSync(join(dir, file)).mtime }))
        .sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
    }
    return fs.readdirSync(dir)
      .filter((file) => fs.lstatSync(join(dir, file)).isFile())
      .map((file) => ({ file, mtime: fs.lstatSync(join(dir, file)).mtime }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  };