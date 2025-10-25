import json

def simple_room_mesh(width: float, depth: float, height: float, openings_json: str):
    try:
        openings = json.loads(openings_json)
    except Exception:
        openings = []
    vertices = [
        [0,0,0],[width,0,0],[width,depth,0],[0,depth,0],
        [0,0, height],[width,0,height],[width,depth,height],[0,depth,height]
    ]
    faces = [[0,1,2],[0,2,3],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]]
    meshes = [{"name":"room","vertices":vertices,"faces":faces,"material":{"color":"#dddddd"}}]
    for i, op in enumerate(openings):
        meshes.append({"name": f"opening_{i}", "type":"hole", "data":op})
    summary = {"bbox":[width, depth, height], "openings": len(openings)}
    return meshes, summary
