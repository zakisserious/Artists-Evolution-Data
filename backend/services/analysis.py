def determine_phase(growth: float) -> str:
    if growth > 0.6:
        return "Growth Era"
    elif 0.2 < growth <= 0.6:
        return "Rising"
    elif -0.2 <= growth <= 0.2:
        return "Peak / Stable"
    else:
        return "Decline"

def compute_analysis(albums: list) -> dict:
    if not albums:
        return {
            "albums": [],
            "breakout_album": None,
            "breakout_year": None,
            "career_phases": []
        }

    # First album has 0 growth and base phase
    albums[0]["growth_rate"] = 0.0
    albums[0]["phase"] = "Early Career"
    
    breakout_album = None
    breakout_year = None
    
    for i in range(1, len(albums)):
        curr_pop = albums[i]["avg_popularity"]
        prev_pop = albums[i-1]["avg_popularity"]
        
        if prev_pop > 0:
            growth = (curr_pop - prev_pop) / prev_pop
        else:
            # If prev popularity implies 0, any positive current is a huge growth. 
            # We can default to a standard high growth if current > 0, or 0 if current is 0.
            growth = 1.0 if curr_pop > 0 else 0.0
            
        albums[i]["growth_rate"] = round(growth, 2)
        albums[i]["phase"] = determine_phase(growth)
        
        if growth > 0.8 and breakout_album is None:
            breakout_album = albums[i]["name"]
            breakout_year = albums[i]["year"]

    # Calculate Career Phases grouped by consecutive phase names
    career_phases = []
    
    current_phase_name = albums[0]["phase"]
    start_year = albums[0]["year"]
    last_year = albums[0]["year"]
    
    for i in range(1, len(albums)):
        phase_name = albums[i]["phase"]
        year = albums[i]["year"]
        
        if phase_name == current_phase_name:
            last_year = year
        else:
            career_phases.append({
                "phase": current_phase_name,
                "start_year": start_year,
                "end_year": last_year
            })
            current_phase_name = phase_name
            start_year = year
            last_year = year
            
    # Append the last running phase
    career_phases.append({
        "phase": current_phase_name,
        "start_year": start_year,
        "end_year": last_year
    })

    return {
        "albums": albums,
        "breakout_album": breakout_album,
        "breakout_year": breakout_year,
        "career_phases": career_phases
    }
