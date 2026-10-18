import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [suggestedByAI, setSuggestedByAI] = useState(false);
  const [aiSource, setAiSource] = useState(null);

  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setErrorMessage('Unable to synchronize tasks with the backend server.');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!title.trim()) {
      setErrorMessage('Please provide a task title to generate specifications.');
      return;
    }

    setErrorMessage('');
    setIsGeneratingAI(true);
    setStatusMessage('Processing objective through backend model proxy...');

    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      });

      const data = await response.json();

      if (data.success && data.data) {
        setDescription(data.data.description || '');
        setPriority(data.data.priority || 'Medium');
        setSuggestedByAI(true);
        setAiSource(data.meta?.provider || 'Automated Engine');
        setStatusMessage('');
      } else {
        setErrorMessage(data.error || 'Failed to generate specification details.');
      }
    } catch (err) {
      console.error('Error querying AI route:', err);
      setErrorMessage('Backend AI service unreachable. Verify that backend is running on port 5000.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setErrorMessage('');
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          suggestedByAI
        })
      });

      const data = await response.json();
      if (data.success) {
        setTasks([data.data, ...tasks]);
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setSuggestedByAI(false);
        setAiSource(null);
        setStatusMessage('Task recorded successfully.');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to record task.');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setErrorMessage('Network error while committing task.');
    }
  };

  const handleToggleTask = async (id) => {
    try {
      const response = await fetch(`/api/tasks/${id}/toggle`, {
        method: 'PATCH'
      });
      const data = await response.json();
      if (data.success) {
        setTasks(tasks.map((t) => (t.id === id ? data.data : t)));
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setTasks(tasks.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Error removing task:', err);
    }
  };

  return (
    <div className="app-shell">
      {/* Professional Top Navigation */}
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="brand-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="brand-title">TaskFlow Enterprise</span>
        </div>
        <div className="nav-meta">
          Practical 13 &bull; Model Integration
        </div>
      </nav>

      <main className="container">
        {/* Page Header */}
        <header className="page-header">
          <h1 className="page-heading">Workflow & Task Automation</h1>
          <p className="page-subheading">
            Define objectives, auto-populate technical acceptance criteria through server-side LLM completion, and manage sprint backlog items.
          </p>
        </header>

        <div className="workspace-grid">
          {/* Form Panel */}
          <section className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Create Task Definition
              </span>
            </div>

            <div className="panel-body">
              <form onSubmit={handleSubmitTask}>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-title">
                    Objective / Title
                  </label>
                  <div className="input-with-action">
                    <input
                      id="task-title"
                      className="form-input"
                      type="text"
                      placeholder="e.g., Implement OAuth2 authorization code flow"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-ai-action"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI || !title.trim()}
                      title="Auto-generate criteria and priority using server-side LLM"
                    >
                      {isGeneratingAI ? (
                        <>
                          <span className="spinner-clean"></span>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          <span>Auto-Complete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {suggestedByAI && (
                  <div className="alert-box alert-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <div>
                      <strong>Automated Suggestion:</strong> Details below were generated by {aiSource}. Review and edit criteria as needed before saving.
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="task-desc">
                    Technical Scope & Acceptance Criteria
                  </label>
                  <textarea
                    id="task-desc"
                    className="form-input form-textarea"
                    placeholder="Provide acceptance criteria, implementation notes, or use Auto-Complete..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="task-priority">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    className="form-input"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                {errorMessage && (
                  <div className="alert-box alert-error">
                    <span>{errorMessage}</span>
                  </div>
                )}

                {statusMessage && (
                  <div className="alert-box alert-success">
                    <span>{statusMessage}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary">
                  Save to Backlog
                </button>
              </form>
            </div>
          </section>

          {/* Task Board Panel */}
          <section className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
                Sprint Backlog ({tasks.length})
              </span>
            </div>

            <div className="panel-body">
              {isLoadingTasks ? (
                <div className="empty-board">
                  <span className="spinner-clean"></span>
                  <p style={{ marginTop: '0.5rem' }}>Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="empty-board">
                  No active tasks. Enter an objective and utilize Auto-Complete to initialize your backlog.
                </div>
              ) : (
                <div className="task-list">
                  {tasks.map((task) => (
                    <article
                      key={task.id}
                      className={`task-row ${task.status === 'completed' ? 'is-completed' : ''}`}
                    >
                      <div className="task-top">
                        <div className="task-check-area">
                          <input
                            type="checkbox"
                            className="task-checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => handleToggleTask(task.id)}
                            id={`check-${task.id}`}
                          />
                          <label
                            htmlFor={`check-${task.id}`}
                            className={`task-name ${task.status === 'completed' ? 'struck' : ''}`}
                          >
                            {task.title}
                          </label>
                        </div>
                        <button
                          className="btn-remove"
                          onClick={() => handleDeleteTask(task.id)}
                          title="Remove task"
                          aria-label="Remove task"
                        >
                          Remove
                        </button>
                      </div>

                      {task.description && (
                        <p className="task-body-desc">{task.description}</p>
                      )}

                      <div className="task-footer-tags">
                        <span className={`pill pill-${(task.priority || 'medium').toLowerCase()}`}>
                          {task.priority || 'Medium'}
                        </span>
                        {task.suggestedByAI && (
                          <span className="pill pill-automated">
                            Automated
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
