const router = require('express').Router();
const { Op } = require('sequelize');
const { Task, Project, ProjectMember, User } = require('../models');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Get all projects user is in
    const memberships = await ProjectMember.findAll({ where: { userId } });
    const projectIds = memberships.map(m => m.projectId);

    // Tasks assigned to user
    const myTasks = await Task.findAll({
      where: { assigneeId: userId },
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
    });

    // All tasks in user's projects
    const allTasks = await Task.findAll({
      where: { projectId: { [Op.in]: projectIds } },
    });

    const todo = allTasks.filter(t => t.status === 'todo').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const done = allTasks.filter(t => t.status === 'done').length;
    const overdue = allTasks.filter(
      t => t.dueDate && t.dueDate < today && t.status !== 'done'
    ).length;

    // Recent tasks (last 5)
    const recentTasks = await Task.findAll({
      where: { projectId: { [Op.in]: projectIds } },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.json({
      stats: {
        totalProjects: projectIds.length,
        myTasks: myTasks.length,
        todo, inProgress, done, overdue,
        totalTasks: allTasks.length,
      },
      recentTasks,
      myTasks: myTasks.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
