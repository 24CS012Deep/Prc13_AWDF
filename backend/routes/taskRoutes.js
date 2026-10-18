const express = require('express');
const router = express.Router();

// In-memory data store for tasks
let tasks = [
  {
    id: 1,
    title: 'Conduct Q4 Sprint Retrospective',
    description: 'Review key deliverables, identify system bottlenecks, and document action items for next sprint.',
    priority: 'High',
    status: 'completed',
    suggestedByAI: false,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 2,
    title: 'Migrate MongoDB Cluster to Atlas M10',
    description: 'Execute zero-downtime database replica set failover and update connection pool configs in production.',
    priority: 'Urgent',
    status: 'pending',
    suggestedByAI: false,
    createdAt: new Date().toISOString()
  }
];

// GET /api/tasks - Retrieve all tasks
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// POST /api/tasks - Create a new task (optionally with AI metadata)
router.post('/', (req, res) => {
  const { title, description, priority, suggestedByAI } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Task title is required.'
    });
  }

  const newTask = {
    id: Date.now(),
    title: title.trim(),
    description: description ? description.trim() : '',
    priority: priority || 'Medium',
    status: 'pending',
    suggestedByAI: Boolean(suggestedByAI),
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);

  res.status(201).json({
    success: true,
    message: 'Task created successfully.',
    data: newTask
  });
});

// PATCH /api/tasks/:id/toggle - Toggle task completion status
router.patch('/:id/toggle', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found.'
    });
  }

  task.status = task.status === 'completed' ? 'pending' : 'completed';

  res.json({
    success: true,
    message: `Task marked as ${task.status}.`,
    data: task
  });
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const initialLength = tasks.length;
  tasks = tasks.filter(t => t.id !== id);

  if (tasks.length === initialLength) {
    return res.status(404).json({
      success: false,
      error: 'Task not found.'
    });
  }

  res.json({
    success: true,
    message: 'Task deleted successfully.'
  });
});

module.exports = router;
