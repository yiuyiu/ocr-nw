const info = require('./package.json')
const info2 = require('./package-lock.json');
var depends = Object.keys(info.dependencies).join(",");

const mod = [];
const scanForValue=(val)=>{
   var req = info2.dependencies[val]['requires'];
   if(req){
       Object.keys(req).map(item=>{
           mod.push(item)
           scanForValue(item)
       })
   }
}
scanForValue('desktop-screenshot')
mod.push('desktop-screenshot')
exports.depends = mod.join(",")