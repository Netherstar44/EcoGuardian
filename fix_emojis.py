import os

replacements = {
    'ðŸ“…': '📅',
    'ðŸ“ ': '📍',
    'ðŸ †': '🏆',
    'ðŸŒ±': '🌱',
    'ðŸ” ': '🔍',
    'ðŸ”¥': '🔥',
    'ðŸ˜„': '😄',
    'ðŸ˜¢': '😢',
    'ðŸ™ ': '🙏',
    'ðŸ‘ ': '👏',
    'â ¤ï¸ ': '❤️',
    'ðŸ˜±': '😱',
    'ðŸ’ƒ': '💃',
}

directory = 'client/src/pages'

for filename in os.listdir(directory):
    if filename.endswith('.tsx'):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        modified = False
        for bad, good in replacements.items():
            if bad in content:
                content = content.replace(bad, good)
                modified = True
                
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed {filename}')
