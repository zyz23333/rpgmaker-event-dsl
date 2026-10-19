const fs=require('node:fs'),path=require('node:path');
const root=process.argv[2],ts=require(path.join(root,'node_modules/typescript'));
const files=['packages/rpgmaker-event-dsl/test/dsl.test.ts','packages/rpgmaker-event-dsl/test/events.test.ts','example/full-event/src/full-event.events.ts'];
const updates=[];
for(const file of files){
  const target=path.join(root,file),source=fs.readFileSync(target,'utf8'),parsed=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true),edits=[];
  const visit=node=>{if(ts.isPropertyAssignment(node)&&node.name.getText(parsed)==='audio'&&ts.isObjectLiteralExpression(node.initializer)){
    const names=node.initializer.properties.map(property=>property.name?.getText(parsed));
    if(names.includes('asset')){const added=[['volume','90'],['pitch','100'],['pan','0']].filter(([name])=>!names.includes(name)).map(([name,value])=>`${name}: ${value}`);if(added.length)edits.push({at:node.initializer.end-1,text:', '+added.join(', ')});}
  }ts.forEachChild(node,visit);};visit(parsed);
  let result=source;for(const edit of edits.sort((a,b)=>b.at-a.at))result=result.slice(0,edit.at)+edit.text+result.slice(edit.at);
  fs.writeFileSync(target,result);updates.push({file,editedPayloads:edits.length});
}
process.stdout.write(JSON.stringify(updates)+'\n');
