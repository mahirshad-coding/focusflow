with open('gamification.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_badge = '''  {
    id: 'agent_of_chaos',
    title: 'Agent of Chaos',
    description: 'Started a scheduled task completely out of order. Why do you even bother making a schedule? \U0001F32A\uFE0F',
    icon: '\U0001F92A',
    req: (stats) => stats.earlyStarts >= 1
  },
  {
    id: 'visionary_procrastinator','''

content = content.replace("  {\n    id: 'visionary_procrastinator',", new_badge)

with open('gamification.js', 'w', encoding='utf-8') as f:
    f.write(content)
