'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = 'M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-27-final';
const base = __dirname;
const evidence = '.scratch/complete-mv-events-implementation/evidence';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = name => JSON.parse(fs.readFileSync(path.join(base, name), 'utf8'));
const failure = read('native-audit-v1-failure-correction-v2.json');
const own = read('independent-native-audit-v2-50d48d8a-3d3c-4402-891a-faee1e5014c4.json');
const independent = read('choices27-root-native-outcome-2c874aaf-2e89-473a-9259-9f8fe0560fad.json');
assert.equal(read('native-independent-audit-v1/completed.json').exitCode, 1);
assert.equal(read('native-independent-audit-v2/completed.json').exitCode, 0);
assert.equal(own.passed, true);
assert.equal(independent.passed, true);
assert.equal(independent.allEighteenPhysicalTreesGloballyDisjoint, true);
for (const pair of own.pairs) {
  assert.equal(pair.checkpoints, 76);
  assert.equal(pair.fullCheckpoints, 11);
}
const changes = [];
function append(relative, text) {
  const target = path.join(root, relative);
  const before = fs.readFileSync(target);
  assert(!before.includes(Buffer.from(text)));
  fs.appendFileSync(target, text);
  const after = fs.readFileSync(target);
  assert(after.subarray(0, before.length).equals(before));
  changes.push({ path: relative, beforeSha256: sha(before), afterSha256: sha(after), originalPrefixExact: true });
}
append(evidence + '/27-choices-complete-branches.md', '\n### 原生结果的独立复核与审计器修正\n\n当前8对均有76个data检查点、11个完整保护检查点。第一次独立读取器v1实际退出1：它把初始完整副本的inode当作所有发布后文件的不变量。全8对精确定位的差异集合仅为compiled/data/Map001.json，正是公共Push已实际原子替换的owned carrier；所有literal侧无此差异。原失败capture与auditor保留不变。v2仅为该路径绑定发布后完整data检查点的身份及Push afterSHA，并要求与初始inode不同；其他目录和文件仍逐项核对初始身份，所有当前data继续完整匹配最终检查点。该独立v2实际退出0、8对通过，未改任何游戏输入、产物或证明，也未重跑已通过游戏。\n\n根代理另以独立actual-outcome v2读取器复核8对/16侧实际谓词、数字负零Object.is、完整loaded、进程/profile/host/engine/退出和空日志、193个执行输入及6个冻结工具，并遍历reference、seed和16个当前完整游戏树（包括profile），证实18棵物理树跨组身份不相交且无链接、1100文件reference/seed均完整不变。根报告SHA256为85957228f3538f8c449e72aa425d3cb8779038a54c01eaa9870bc383e62a13a5，安全原件随归档保留。根读取器未执行的v1把完整检查点数量预设为10，执行前版本化v2改为实际11；两个源文件均保留，未将静态修正记作一次失败运行。\n');
append(evidence + '/README.md', '\nTicket27 native audit addendum: all8 pairs have76data/11full checkpoints. Original independent-reader v1 exit1 is preserved; its initial inode invariant was narrowed only for the proven atomic Push replacement compiled/data/Map001.json, with every current data identity/hash still bound to the final checkpoint. Versioned v2 exit0 and root independent actual-outcome v2 both pass8pairs/16sides. Root also verifies18 complete globally disjoint regular physical trees including profiles,193execution inputs and6frozen tools; report SHA85957228f3538f8c449e72aa425d3cb8779038a54c01eaa9870bc383e62a13a5.\n');
const attributes = path.join(root, '.gitattributes');
const rule = '/.scratch/complete-mv-events-implementation/evidence/27-final-history/** -text -whitespace';
assert(!fs.readFileSync(attributes, 'utf8').includes(rule));
append('.gitattributes', '\n# Preserve closed original Ticket27 finalization captures and immutable audits.\n' + rule + '\n');
const receipt = { at: new Date().toISOString(), failureCorrection: failure.derived, ownAuditPassed: own.passed, rootAuditPassed: independent.passed, changes };
fs.writeFileSync(path.join(base, 'native-audit-report-append-v1.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(receipt, null, 2));
