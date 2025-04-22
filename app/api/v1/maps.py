from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
from app.simulation.maps import MapLayout, MapCallout, MapArea, map_collection

router = APIRouter()

@router.get("/")
async def get_maps():
    """Get available maps."""
    from app.game import ValorantSim
    game = ValorantSim()
    return {
        "maps": game.maps
    }

@router.post("/")
async def save_map(map_data: dict):
    """Save a custom map."""
    try:
        # Create a new MapLayout from the data
        logging.info(f"Attempting to save map: {map_data.get('name', 'Unnamed')}")
        
        if not map_data.get("name"):
            logging.error("Map save failed: No map name provided")
            return {"success": False, "error": "Map name is required"}
        
        map_id = map_data.get("name", "").lower().replace(" ", "_")
        logging.info(f"Map ID generated: {map_id}")
        
        # Validate map data
        if not map_data.get("areas"):
            logging.warning(f"Map {map_id} has no areas defined")
        
        # Convert areas to map callouts if needed
        callouts = {}
        areas = []
        
        try:
            for area in map_data.get("areas", []):
                area_type_str = area.get("type", "connector")
                area_type = getattr(MapArea, area_type_str.upper(), MapArea.CONNECTOR)
                
                # Store raw polygon data for custom rendering
                areas.append({
                    "name": area.get("name", "Unnamed"),
                    "type": area_type_str,
                    "color": area.get("color", "#cccccc"),
                    "points": area.get("points", []),
                    "description": area.get("description", "")
                })
                
                # Calculate position from polygon centroid
                points = area.get("points", [])
                if points:
                    x_sum = sum(p.get("x", 0) for p in points) / len(points)
                    y_sum = sum(p.get("y", 0) for p in points) / len(points)
                    position = (x_sum / 1024, y_sum / 1024)  # Convert to 0-1 scale
                    size = (0.1, 0.1)  # Default size
                    
                    # Add as callout
                    callout_key = area.get("name", "").lower().replace(" ", "_")
                    callouts[callout_key] = MapCallout(
                        name=area.get("name", "Unnamed"),
                        area_type=area_type,
                        position=position,
                        size=size,
                        description=area.get("description", ""),
                        typical_roles=[]
                    )
            
            logging.info(f"Processed {len(areas)} areas and {len(callouts)} callouts for map {map_id}")
        except Exception as area_error:
            logging.error(f"Error processing map areas: {str(area_error)}")
            return {"success": False, "error": f"Error processing map areas: {str(area_error)}"}
        
        try:
            # Create the map layout
            new_map = MapLayout(
                id=map_id,
                name=map_data.get("name", "Custom Map"),
                image_url=map_data.get("image_url", "/static/maps/default.jpg"),
                width=1024,
                height=1024,
                callouts=callouts,
                sites=map_data.get("sites", ["A", "B"]),
                areas=areas
            )
            
            # Add to the map collection
            map_collection.add_map(new_map)
            
            logging.info(f"Map {map_id} successfully saved to collection")
            return {"success": True, "map_id": map_id}
        except Exception as map_error:
            logging.error(f"Error creating or saving map layout: {str(map_error)}")
            return {"success": False, "error": f"Error creating or saving map layout: {str(map_error)}"}
    except Exception as e:
        logging.error(f"Unexpected error saving map: {str(e)}")
        return {"success": False, "error": str(e)}

@router.get("/{map_id}/exists")
async def map_exists(map_id: str):
    """Check if a map exists in the collection by ID."""
    try:
        # Clean the map ID to follow the same format used when saving
        clean_map_id = map_id.lower().replace(" ", "_")
        logging.info(f"Checking if map exists: {clean_map_id}")
        
        # Check if the map exists in the collection
        exists = map_collection.get_map(clean_map_id) is not None
        
        if exists:
            logging.info(f"Map {clean_map_id} found in collection")
        else:
            logging.info(f"Map {clean_map_id} not found in collection")
            
        return {"exists": exists}
    except Exception as e:
        logging.error(f"Error checking if map exists: {str(e)}")
        return {"exists": False, "error": str(e)} 