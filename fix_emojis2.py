import sys

filepath = 'client/src/pages/Community.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id: "gracias"' in line:
        lines[i] = '                      { id: "gracias", label: "🙏 Gracias" },\n'
    elif 'id: "aplausos"' in line:
        lines[i] = '                      { id: "aplausos", label: "👏 Aplausos" },\n'
    elif 'id: "amor"' in line:
        lines[i] = '                      { id: "amor", label: "❤️ Amor" },\n'
    elif 'Buscar GIF...' in line and 'placeholder=' in line:
        lines[i] = '                    placeholder="🔍 Buscar GIF..."\n'

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)
