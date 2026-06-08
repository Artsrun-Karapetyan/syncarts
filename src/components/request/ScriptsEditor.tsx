import { useState } from 'react';
import { BookTemplate, Search, X } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import CodeEditor from '@uiw/react-textarea-code-editor';
import '@uiw/react-textarea-code-editor/dist.css';

const SNIPPET_GROUPS = [
  {
    category: 'Variables',
    items: [
      { name: 'Get a global variable', code: 'sy.globals.get("variable_key");' },
      { name: 'Get a collection variable', code: 'sy.collectionVariables.get("variable_key");' },
      { name: 'Get an environment variable', code: 'sy.environment.get("variable_key");' },
      { name: 'Get a variable', code: 'sy.variables.get("variable_key");' },
      { name: 'Set a global variable', code: 'sy.globals.set("variable_key", "variable_value");' },
      { name: 'Set a collection variable', code: 'sy.collectionVariables.set("variable_key", "variable_value");' },
      { name: 'Set an environment variable', code: 'sy.environment.set("variable_key", "variable_value");' },
      { name: 'Set a variable', code: 'sy.variables.set("variable_key", "variable_value");' },
      { name: 'Clear a global variable', code: 'sy.globals.unset("variable_key");' },
      { name: 'Clear a collection variable', code: 'sy.collectionVariables.unset("variable_key");' },
      { name: 'Clear an environment variable', code: 'sy.environment.unset("variable_key");' },
      { name: 'Clear a local variable', code: 'sy.variables.unset("variable_key");' },
    ]
  },
  {
    category: 'Workflows',
    items: [
      { name: 'Send an HTTP request', code: 'sy.sendRequest("https://postman-echo.com/get", function (err, response) {\n    console.log(response.json());\n});' },
      { name: 'Send an HTTP request from a Collection', code: 'sy.sendRequest("https://postman-echo.com/get", function (err, response) {\n    console.log(response.json());\n});' },
    ]
  },
  {
    category: 'Tests',
    items: [
      { name: 'Status code: Code is 200', code: 'sy.test("Status code is 200", function () {\n    sy.response.to.have.status(200);\n});' },
      { name: 'Response body: Contains string', code: 'sy.test("Body matches string", function () {\n    sy.expect(sy.response.text()).to.include("string_you_want_to_search");\n});' },
      { name: 'Response body: JSON value check', code: 'var jsonData = sy.response.json();\nsy.test("Your test name", function () {\n    sy.expect(jsonData.value).to.eql(100);\n});' },
      { name: 'Response body: Is equal to a string', code: 'sy.test("Body is correct", function () {\n    sy.response.to.have.body("response_body_string");\n});' },
      { name: 'Response headers: Content-Type header check', code: 'sy.test("Content-Type is present", function () {\n    sy.response.to.have.header("Content-Type");\n});' },
      { name: 'Response time is less than 200ms', code: 'sy.test("Response time is less than 200ms", function () {\n    sy.expect(sy.response.responseTime).to.be.below(200);\n});' },
      { name: 'Status code: Successful POST request', code: 'sy.test("Successful POST request", function () {\n    sy.expect(sy.response.code).to.be.oneOf([201, 202]);\n});' },
      { name: 'Status code: Code name has string', code: 'sy.test("Status code name has string", function () {\n    sy.response.to.have.status("Created");\n});' },
      { name: 'Response body: Convert XML body to a JSON Object', code: 'var jsonObject = xml2Json(sy.response.text());\nconsole.log(jsonObject);' },
      { name: 'Use Tiny Validator for JSON data', code: 'var schema = {\n    "items": {\n        "type": "boolean"\n    }\n};\n\nvar data1 = [true, false];\nvar data2 = [true, 123];\n\nsy.test(\'Schema is valid\', function() {\n  sy.expect(tv4.validate(data1, schema)).to.be.true;\n  sy.expect(tv4.validate(data2, schema)).to.be.true;\n});' },
    ]
  }
];

export function ScriptsEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const [showSnippets, setShowSnippets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'pre' | 'post'>('pre');

  if (!activeTab) return null;

  const handleSnippetClick = (code: string) => {
    if (activeSubTab === 'pre') {
      const currentCode = activeTab.preRequestScript || '';
      const newCode = currentCode.length > 0 && !currentCode.endsWith('\n') 
        ? `${currentCode}\n${code}` 
        : `${currentCode}${code}`;
      updateActiveTab({ preRequestScript: newCode });
    } else {
      const currentCode = activeTab.testScript || '';
      const newCode = currentCode.length > 0 && !currentCode.endsWith('\n') 
        ? `${currentCode}\n${code}` 
        : `${currentCode}${code}`;
      updateActiveTab({ testScript: newCode });
    }
  };

  const filteredGroups = SNIPPET_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(group => group.items.length > 0);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Editor Section */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              className={`btn`}
              style={{ padding: '4px 8px', fontWeight: activeSubTab === 'pre' ? 700 : 500, color: activeSubTab === 'pre' ? 'var(--text-primary)' : 'var(--text-secondary)', background: 'transparent' }}
              onClick={() => setActiveSubTab('pre')}
            >
              Pre-request
            </button>
            <button
              className={`btn`}
              style={{ padding: '4px 8px', fontWeight: activeSubTab === 'post' ? 700 : 500, color: activeSubTab === 'post' ? 'var(--text-primary)' : 'var(--text-secondary)', background: 'transparent' }}
              onClick={() => setActiveSubTab('post')}
            >
              Post-response
            </button>
          </div>
          <button 
            className="btn" 
            style={{ padding: '6px 12px', fontSize: 12, background: showSnippets ? 'var(--bg-tertiary)' : 'transparent' }}
            onClick={() => setShowSnippets(!showSnippets)}
          >
            <BookTemplate size={14} style={{ marginRight: 6 }} /> Snippets
          </button>
        </div>
        <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', fontSize: 12, color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
          {activeSubTab === 'pre' 
            ? 'Scripts written here will be executed before a request is sent.'
            : 'Scripts written here will be executed after a response is received.'}
          {' '}You can use the <code>sy</code> object to interact with the environment.
        </div>
        <div 
          data-color-mode="dark"
          style={{ 
            flex: 1, 
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
          }}
          onClick={(e) => {
            const textarea = e.currentTarget.querySelector('textarea');
            if (textarea && e.target === e.currentTarget) {
              textarea.focus();
              const length = textarea.value.length;
              textarea.setSelectionRange(length, length);
            }
          }}
        >
          <CodeEditor
            value={activeSubTab === 'pre' ? (activeTab.preRequestScript || '') : (activeTab.testScript || '')}
            language="js"
            placeholder="Write your scripts here... Example: sy.environment.set('token', sy.response.json().access_token);"
            onChange={(evn) => {
              if (activeSubTab === 'pre') {
                updateActiveTab({ preRequestScript: evn.target.value });
              } else {
                updateActiveTab({ testScript: evn.target.value });
              }
            }}
            padding={24}
            style={{
              flex: 1,
              fontSize: 14,
              backgroundColor: "transparent",
              fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
              minHeight: '100%',
            }}
          />
        </div>
      </div>

      {/* Snippets Drawer */}
      {showSnippets && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          bottom: 0, 
          width: 300, 
          background: 'var(--bg-secondary)', 
          borderLeft: '1px solid var(--border-color)', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Snippets</div>
            <button className="btn" style={{ padding: 4, width: 24, height: 24, justifyContent: 'center' }} onClick={() => setShowSnippets(false)}>
              <X size={14} />
            </button>
          </div>
          
          <div style={{ padding: 12, borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search snippets..."
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px 8px' }}>
            {filteredGroups.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>No snippets found</div>
            ) : (
              filteredGroups.map((group, gIdx) => (
                <div key={gIdx} style={{ marginBottom: 12 }}>
                  <div style={{ 
                    padding: '8px 12px 4px', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: 'var(--text-tertiary)' 
                  }}>
                    {group.category}
                  </div>
                  {group.items.map((snippet, idx) => (
                    <button
                      key={idx}
                      className="btn snippet-btn"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        padding: '6px 12px',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 6,
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onClick={() => handleSnippetClick(snippet.code)}
                    >
                      {snippet.name}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
