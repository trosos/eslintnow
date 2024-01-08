<?xml version="1.0" encoding="UTF-8"?><unload unload_date="{../timestamp.txt|cat}">
<sys_remote_update_set action="INSERT_OR_UPDATE">
<application display_value="ESLintNow">{1:sys_app:1:ESLintNow|md5}</application>
<application_name>ESLintNow</application_name>
<application_scope>x_eslintnow</application_scope>
<application_version>1.0.0</application_version>
<collisions/>
<commit_date/>
<deleted/>
<description/>
<inserted/>
<name>ESLintNow {../timestamp.txt|cat}</name>
<origin_sys_id/>
<parent display_value=""/>
<release_date/>
<remote_base_update_set display_value=""/>
<remote_parent_id/>
<remote_sys_id>{1:sys_update_set:1:\l../dist/build_hash.txt\pcat\r|subs|eval|md5}</remote_sys_id>
<state>loaded</state>
<summary/>
<sys_class_name>sys_remote_update_set</sys_class_name>
<sys_created_by>admin</sys_created_by>
<sys_created_on>{../timestamp.txt|cat}</sys_created_on>
<sys_id>{1:sys_remote_update_set:1:\l../dist/build_hash.txt\pcat\r|subs|eval|md5}</sys_id>
<sys_mod_count>0</sys_mod_count>
<sys_updated_by>admin</sys_updated_by>
<sys_updated_on>{../timestamp.txt|cat}</sys_updated_on>
<update_set display_value=""/>
<update_source display_value=""/>
<updated/>
</sys_remote_update_set>

{app_update.inc|cat|eval|subs|eval}

{Linter|set}
{proxy_si.inc|cat|eval|eval}

{SourceCodeFixer|set}
{proxy_si.inc|cat|eval|eval}

{SourceCode|set}
{proxy_si.inc|cat|eval|eval}

{Rules|set}
{proxy_si.inc|cat|eval|eval}

{espree|set}
{proxy_si.inc|cat|eval|eval}

{ajv|set}
{proxy_si.inc|cat|eval|eval}

{JSBI|set}
{proxy_si.inc|cat|eval|eval}

{eslintUtils|set}
{proxy_si.inc|cat|eval|eval}

{regexpp|set}
{proxy_si.inc|cat|eval|eval}

{Traverser|set}
{proxy_si.inc|cat|eval|eval}

{ruleUtils|set}
{file_si.inc|cat|eval|eval}

{ruleTester|set}
{file_si.inc|cat|eval|eval}

{ruleTests|set}
{file_si.inc|cat|eval|eval}

{ruleTestsChunk1|set}
{file_si.inc|cat|eval|eval}

{ruleTestsChunk2|set}
{file_si.inc|cat|eval|eval}

{bundle|set}
{file_si.inc|cat|eval|eval}

</unload>
