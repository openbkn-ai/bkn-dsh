"""Validate content and assign every operation step to exactly one figure."""
def figure_step_groups(section):
    steps, figures = section['steps'], section['figures']
    groups = section.get('step_groups')
    if not figures:
        if groups not in (None, []):
            raise ValueError(f"{section['id']}: step_groups require figures")
        return []
    if groups is None:
        # Contiguous, balanced groups adapt to added/removed figures and steps.
        size, extra = divmod(len(steps), len(figures))
        groups, cursor = [], 0
        for index in range(len(figures)):
            end = cursor + size + (index < extra)
            groups.append(list(range(cursor, end)))
            cursor = end
    if not isinstance(groups, list) or len(groups) != len(figures):
        raise ValueError(f"{section['id']}: step_groups must have one list per figure")
    indices = []
    for group in groups:
        if not isinstance(group, list) or any(type(i) is not int for i in group):
            raise ValueError(f"{section['id']}: step_groups must contain integer step indices")
        indices.extend(group)
    if sorted(indices) != list(range(len(steps))):
        raise ValueError(f"{section['id']}: step_groups must cover every step exactly once (zero-based indices)")
    return groups


def validate_sections(sections):
    ids = set()
    for section in sections:
        if section['id'] in ids:
            raise ValueError(f"Duplicate section id: {section['id']}")
        ids.add(section['id'])
        figure_step_groups(section)
