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

  // Fetch all tasks on component mount
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
      setErrorMessage('Could not load existing tasks from server.');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Generate task details using backend AI route
  const handleGenerateAI = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a task title first so AI can analyze the objective.');
      return;
    }

    setErrorMessage('');
    setIsGeneratingAI(true);
    setStatusMessage('Querying backend AI engine...');

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
        setAiSource(data.meta?.source || 'ai');
        setStatusMessage(`AI generated details (${data.meta?.model || 'assisted'}). You can edit them before saving.`);
      } else {
        setErrorMessage(data.error || 'Failed to generate AI suggestion.');
      }
    } catch (err) {
      console.error('Error querying AI route:', err);
      setErrorMessage('Backend AI service unreachable. Please ensure backend is running.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save new task to backend
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
        setStatusMessage('Task saved successfully.');
      } else {
        setErrorMessage(data.error || 'Failed to save task.');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setErrorMessage('Network error while saving task.');
    }
  };

  // Toggle task status
  const handleToggleTask = async (id) => {
    try {
      const response = await fetch(`/api/tasks/${id}/toggle`, {
        method: 'PATCH'
      });
      const data = await response.json();
      if (data.success) {
        setTasks(tasks.map(t => (t.id === id ? data.data : t)));
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // Delete task
  const handleDeleteTask = async (id) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setTasks(tasks.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="badge">Practical 13 &bull; AI Assistant Integration</div>
        <h1 className="title">AI-Augmented Task Manager</h1>
        <p className="subtitle">
          Accelerate workflow definition with server-side LLM completion, prompt engineering, and contextual fallbacks.
        </p>
      </header>

      <div className="main-grid">
        {/* Task Creation & AI Suggestion Panel */}
        <section className="card">
          <h2 className="card-title">
            <span>✨</span> Create New Task
          </h2>

          <form onSubmit={handleSubmitTask}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">
                Task Title / Objective
              </label>
              <div className="input-row">
                <input
                  id="task-title"
                  className="input-field"
                  type="text"
                  placeholder="e.g. Implement OAuth2 login with Google"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-ai"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI || !title.trim()}
                  title="Generate task description and priority via AI"
                >
                  {isGeneratingAI ? (
                    <>
                      <span className="spinner"></span> Generating...
                    </>
                  ) : (
                    <>✨ AI Suggest</>
                  )}
                </button>
              </div>
            </div>

            {suggestedByAI && (
              <div className="ai-disclaimer">
                <span>🤖</span>
                <span>
                  <strong>AI Generated Suggestion:</strong> Review and refine the details below before saving to your task repository. Source: {aiSource}.
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="task-desc">
                Task Description & Acceptance Criteria
              </label>
              <textarea
                id="task-desc"
                className="input-field textarea-field"
                placeholder="Detailed steps, criteria, or let AI generate this for you..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">
                Priority Level
              </label>
              <select
                id="task-priority"
                className="input-field"
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
              <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {errorMessage}
              </p>
            )}

            {statusMessage && (
              <p style={{ color: '#34d399', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {statusMessage}
              </p>
            )}

            <button type="submit" className="btn btn-primary">
              Add Task to Board
            </button>
          </form>
        </section>

        {/* Task List Panel */}
        <section className="card">
          <h2 className="card-title">
            <span>📋</span> Active Task Board ({tasks.length})
          </h2>

          {isLoadingTasks ? (
            <div className="empty-state">
              <span className="spinner"></span> Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              No tasks created yet. Enter an objective and try the AI Suggest feature!
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
                >
                  <div className="task-header">
                    <div className="task-title-area">
                      <input
                        type="checkbox"
                        className="task-checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => handleToggleTask(task.id)}
                        id={`task-${task.id}`}
                      />
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`task-title ${task.status === 'completed' ? 'done' : ''}`}
                      >
                        {task.title}
                      </label>
                    </div>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete task"
                      aria-label="Delete task"
                    >
                      ✕
                    </button>
                  </div>

                  {task.description && (
                    <p className="task-desc">{task.description}</p>
                  )}

                  <div className="task-meta">
                    <span className={`priority-tag priority-${task.priority}`}>
                      {task.priority}
                    </span>
                    {task.suggestedByAI && (
                      <span className="ai-tag">✨ AI-Assisted</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
