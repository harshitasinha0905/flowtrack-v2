select
  p.name as project,
  count(t.id) as tasks
from public.projects p
left join public.tasks t
  on t.project_id = p.id
group by p.id, p.name
order by p.name;