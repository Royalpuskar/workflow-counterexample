import {pathToFileURL} from 'node:url';
import {verifyRepairEvidence} from './verify-repair.mjs';
const LIMIT=8*1024*1024;
export async function main(args=process.argv.slice(2)){
 if(args.length!==1){process.stderr.write('Usage: node verify-repair-cli.mjs evidence.json\n');return 2;}
 try{
  // Read at most LIMIT + 1 bytes, including for files that grow during reading.
  const {open}=await import('node:fs/promises');const file=await open(args[0],'r');let bytes;
  try{const stat=await file.stat();if(!stat.isFile()||stat.size>LIMIT)throw Error();const chunks=[];let total=0;
   while(total<=LIMIT){const chunk=Buffer.alloc(Math.min(65536,LIMIT+1-total));const {bytesRead}=await file.read(chunk,0,chunk.length,null);if(!bytesRead)break;chunks.push(chunk.subarray(0,bytesRead));total+=bytesRead;}
   if(total>LIMIT)throw Error();bytes=Buffer.concat(chunks);
  }finally{await file.close();}
  const evidence=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));const result=verifyRepairEvidence(evidence);
  process.stdout.write(JSON.stringify(result)+'\n');return result.valid?0:1;
 }catch{process.stderr.write('Cannot read evidence: expected a regular UTF-8 JSON file of at most 8 MiB.\n');return 2;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)process.exitCode=await main();
