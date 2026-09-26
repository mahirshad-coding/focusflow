/**
 * FocusFlow — Predictive Suggestion Engine
 * Learns user habits, schedules, and task sequences to predict what tasks they are most likely
 * to work on tomorrow or the next day, and generates role-tailored starter tasks.
 */

class PredictiveSuggestionEngine {
  constructor() {}

  /**
   * Generates prioritized suggestions for a target date.
   * @param {Array} allTasks Full list of historical and current tasks
   * @param {Date} targetDate The date we want to predict for (e.g. tomorrow)
   * @param {Object} userProfile User profile containing name, work, age
   * @returns {Array} Scored suggestion objects
   */
  generateSuggestions(allTasks = [], targetDate = new Date(), userProfile = null) {
    const suggestions = [];
    const targetDayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon ...
    const todayStr = this.formatDate(new Date());

    // If user has minimal task history, prioritize high-relevance role-based suggestions
    if (!allTasks || allTasks.length < 2) {
      const roleTasks = this.getRoleBasedSuggestions(userProfile ? userProfile.work : '');
      roleTasks.forEach(item => {
        suggestions.push({
          title: item.title,
          originalTitle: item.title,
          score: 85,
          reason: item.reason,
          badgeColor: item.badgeColor,
          estimatedMinutes: item.estimatedMinutes,
          tags: item.tags || []
        });
      });
      return suggestions.slice(0, 4);
    }

    // Group tasks by title/topic to find patterns
    const taskMap = new Map();

    allTasks.forEach(task => {
      const normalizedTitle = this.normalizeTitle(task.title);
      if (!taskMap.has(normalizedTitle)) {
        taskMap.set(normalizedTitle, {
          rawTitle: task.title,
          tags: task.tags || [],
          instances: [],
          totalMinutes: 0,
          isCompletedRecent: false,
          hasCarryover: false,
          lastDate: task.date
        });
      }

      const item = taskMap.get(normalizedTitle);
      item.instances.push(task);
      item.totalMinutes += (task.actualMinutes || 0);

      // Check if task is today or yesterday and incomplete
      if (!task.isCompleted && task.date <= todayStr) {
        item.hasCarryover = true;
      }
      if (task.date >= item.lastDate) {
        item.lastDate = task.date;
        item.isCompletedRecent = task.isCompleted;
      }
    });

    taskMap.forEach((item, normTitle) => {
      let score = 0;
      let primaryReason = '';
      let badgeColor = 'indigo';

      // Signal 1: Carryover / Incomplete from recent days (Highest priority)
      if (item.hasCarryover && !item.isCompletedRecent) {
        score += 65;
        primaryReason = 'Carryover from recent work';
        badgeColor = 'amber';
      }

      // Signal 2: Day-of-Week Recurrence (E.g. Monday Sprint Planning or Friday Reviews)
      const dayMatches = item.instances.filter(inst => {
        const d = new Date(inst.date + 'T00:00:00');
        return d.getDay() === targetDayOfWeek;
      });
      if (dayMatches.length >= 2) {
        score += 45;
        primaryReason = `Regular habit on this weekday`;
        badgeColor = 'cyan';
      } else if (dayMatches.length === 1 && score < 50) {
        score += 20;
        if (!primaryReason) primaryReason = 'Logged on this weekday previously';
      }

      // Signal 3: Frequency & Recency (Ongoing active sprint)
      const daysSinceLast = this.getDaysDiff(new Date(item.lastDate + 'T00:00:00'), targetDate);
      if (daysSinceLast <= 5) {
        score += 30; // Active within last 5 days
        if (!primaryReason) primaryReason = 'Active ongoing project';
      } else if (daysSinceLast > 14) {
        score -= 25; // Stale, penalize
      }

      // Signal 4: Sequential next-step deduction
      const nextStepPrediction = this.detectSequentialStep(item.rawTitle);
      let predictedTitle = item.rawTitle;
      if (item.isCompletedRecent && nextStepPrediction) {
        predictedTitle = nextStepPrediction;
        score += 50;
        primaryReason = 'Logical next progression';
        badgeColor = 'emerald';
      }

      // Average estimated minutes from history
      const avgEstimate = Math.round(
        item.instances.reduce((acc, curr) => acc + (curr.estimatedMinutes || 60), 0) / item.instances.length
      ) || 60;

      if (score > 15) {
        suggestions.push({
          title: predictedTitle,
          originalTitle: item.rawTitle,
          score,
          reason: primaryReason || 'Learned from focus history',
          badgeColor,
          estimatedMinutes: avgEstimate,
          tags: item.tags
        });
      }
    });

    // If suggestions are fewer than 3, complement with role-based ideas
    if (suggestions.length < 3 && userProfile && userProfile.work) {
      const roleTasks = this.getRoleBasedSuggestions(userProfile.work);
      roleTasks.forEach(rt => {
        if (!suggestions.some(s => s.title.toLowerCase().includes(rt.title.slice(0, 15).toLowerCase()))) {
          suggestions.push({
            title: rt.title,
            originalTitle: rt.title,
            score: 40,
            reason: rt.reason,
            badgeColor: rt.badgeColor,
            estimatedMinutes: rt.estimatedMinutes,
            tags: rt.tags || []
          });
        }
      });
    }

    // Sort by highest score
    suggestions.sort((a, b) => b.score - a.score);

    return suggestions.slice(0, 4);
  }

  getRoleBasedSuggestions(workRole = '') {
    const role = (workRole || '').toLowerCase();

    if (role.includes('student') || role.includes('study') || role.includes('college') || role.includes('school') || role.includes('exam')) {
      return [
        { title: 'Core Textbook Study & Concept Notes #study', estimatedMinutes: 90, reason: 'Tailored for Student', badgeColor: 'indigo', tags: ['study'] },
        { title: 'Practice Problem Set & Exam Prep #prep', estimatedMinutes: 60, reason: 'Concept mastery', badgeColor: 'cyan', tags: ['prep'] },
        { title: 'Flashcards & Key Formula Revision #revision', estimatedMinutes: 30, reason: 'Active recall', badgeColor: 'amber', tags: ['revision'] }
      ];
    } else if (role.includes('code') || role.includes('dev') || role.includes('engineer') || role.includes('program') || role.includes('tech') || role.includes('software')) {
      return [
        { title: 'Core Feature Architecture & Coding #dev', estimatedMinutes: 90, reason: 'Tailored for Engineers', badgeColor: 'indigo', tags: ['dev'] },
        { title: 'Code Review & Pull Request Verification #review', estimatedMinutes: 45, reason: 'Code quality', badgeColor: 'cyan', tags: ['review'] },
        { title: 'Bug Investigation & Automated Tests #debug', estimatedMinutes: 60, reason: 'System stability', badgeColor: 'amber', tags: ['debug'] }
      ];
    } else if (role.includes('finance') || role.includes('account') || role.includes('bank') || role.includes('audit') || role.includes('tax')) {
      return [
        { title: 'Financial Modeling & Balance Reconciliation #finance', estimatedMinutes: 90, reason: 'Tailored for Finance', badgeColor: 'indigo', tags: ['finance'] },
        { title: 'Variance Analysis & Metric Reporting #analysis', estimatedMinutes: 60, reason: 'Operational report', badgeColor: 'cyan', tags: ['analysis'] },
        { title: 'Invoicing, Billing & Compliance Audit #admin', estimatedMinutes: 45, reason: 'Compliance', badgeColor: 'amber', tags: ['admin'] }
      ];
    } else if (role.includes('design') || role.includes('ux') || role.includes('ui') || role.includes('art') || role.includes('creative')) {
      return [
        { title: 'User Flow Wireframing & UI Exploration #design', estimatedMinutes: 90, reason: 'Tailored for Designers', badgeColor: 'indigo', tags: ['design'] },
        { title: 'Design System Polish & Asset Export #system', estimatedMinutes: 60, reason: 'Consistency', badgeColor: 'cyan', tags: ['system'] },
        { title: 'Visual Critique & Stakeholder Feedback #feedback', estimatedMinutes: 45, reason: 'Iteration', badgeColor: 'amber', tags: ['feedback'] }
      ];
    } else if (role.includes('med') || role.includes('doctor') || role.includes('nurse') || role.includes('health') || role.includes('clinic')) {
      return [
        { title: 'Clinical Case Reviews & Medical Journals #med', estimatedMinutes: 90, reason: 'Tailored for Healthcare', badgeColor: 'indigo', tags: ['med'] },
        { title: 'Patient Care Records & Clinical Notes #rounds', estimatedMinutes: 60, reason: 'Patient documentation', badgeColor: 'cyan', tags: ['rounds'] },
        { title: 'Pharmacology & Diagnostic Guidelines #study', estimatedMinutes: 45, reason: 'Clinical study', badgeColor: 'amber', tags: ['study'] }
      ];
    } else if (role.includes('law') || role.includes('legal') || role.includes('attorney') || role.includes('advocate')) {
      return [
        { title: 'Precedent Research & Case Brief Drafting #legal', estimatedMinutes: 90, reason: 'Tailored for Legal', badgeColor: 'indigo', tags: ['legal'] },
        { title: 'Contract Clause Review & Risk Analysis #contracts', estimatedMinutes: 60, reason: 'Risk mitigation', badgeColor: 'cyan', tags: ['contracts'] },
        { title: 'Client Matter Filing & Documentation #admin', estimatedMinutes: 45, reason: 'Case prep', badgeColor: 'amber', tags: ['admin'] }
      ];
    } else {
      return [
        { title: 'High-Impact Focus Block: Priority Deliverable #focus', estimatedMinutes: 90, reason: `Tailored for ${workRole || 'Professionals'}`, badgeColor: 'indigo', tags: ['focus'] },
        { title: 'Strategic Review & Document Drafting #planning', estimatedMinutes: 60, reason: 'Progress milestone', badgeColor: 'cyan', tags: ['planning'] },
        { title: 'Operational Clearing & Stakeholder Sync #admin', estimatedMinutes: 45, reason: 'Daily clearing', badgeColor: 'amber', tags: ['admin'] }
      ];
    }
  }

  detectSequentialStep(title) {
    const lower = title.toLowerCase();
    if (lower.includes('draft') || lower.includes('write')) {
      return title.replace(/draft/i, 'Review & Refine').replace(/write/i, 'Review');
    }
    if (lower.includes('research') || lower.includes('study')) {
      return title.replace(/research/i, 'Summarize & Apply').replace(/study/i, 'Practice Problems for');
    }
    if (lower.includes('design') || lower.includes('plan')) {
      return title.replace(/design/i, 'Implement').replace(/plan/i, 'Execute');
    }
    if (lower.includes('part 1') || lower.includes('chapter 1')) {
      return title.replace(/part 1/i, 'Part 2').replace(/chapter 1/i, 'Chapter 2');
    }
    return null;
  }

  normalizeTitle(title) {
    return title.toLowerCase().trim().replace(/#\w+/g, '').replace(/[^\w\s]/gi, '').trim();
  }

  getDaysDiff(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

window.PredictiveSuggestionEngine = PredictiveSuggestionEngine;
