import streamlit as st
import requests
from datetime import datetime
import pandas as pd

# Set the API base URL
API_BASE_URL = "http://localhost:8000"

# Initialize session state for caching
if 'teams' not in st.session_state:
    st.session_state.teams = []
if 'players' not in st.session_state:
    st.session_state.players = []
if 'games' not in st.session_state:
    st.session_state.games = []

# Use st.cache_data to cache API calls for teams, players, and games
@st.cache_data(ttl=60)
def fetch_teams():
    try:
        response = requests.get(f"{API_BASE_URL}/teams")
        if response.status_code == 200:
            return response.json()
        else:
            st.error("Failed to fetch teams")
            return []
    except requests.RequestException as e:
        st.error(f"Error connecting to API: {str(e)}")
        return []

def fetch_teams_force():
    fetch_teams.clear()
    return fetch_teams()

@st.cache_data(ttl=60)
def fetch_players():
    try:
        response = requests.get(f"{API_BASE_URL}/players")
        if response.status_code == 200:
            return response.json()
        else:
            st.error("Failed to fetch players")
            return []
    except requests.RequestException as e:
        st.error(f"Error connecting to API: {str(e)}")
        return []

def fetch_players_force():
    fetch_players.clear()
    return fetch_players()

@st.cache_data(ttl=60)
def fetch_games():
    try:
        response = requests.get(f"{API_BASE_URL}/games")
        if response.status_code == 200:
            return response.json()
        else:
            st.error("Failed to fetch games")
            return []
    except requests.RequestException as e:
        st.error(f"Error connecting to API: {str(e)}")
        return []

def fetch_games_force():
    fetch_games.clear()
    return fetch_games()

# Add a helper to clear all caches and session state stats
def clear_all_caches():
    st.cache_data.clear()
    # Remove all session state keys related to stats
    for key in list(st.session_state.keys()):
        if key.startswith('stats_game_') or key.startswith('stats_season_'):
            del st.session_state[key]

def team_player_management():
    """Handle team and player management"""
    st.header("Team & Player Management")
    
    # Team Creation
    with st.expander("Add Team", expanded=True):
        team_name = st.text_input("Team Name", key="create_team_name")
        season = st.number_input("Season", min_value=1, value=1, key="create_season")
        league = st.text_input("League", key="create_league")
        wins = st.number_input("Wins", min_value=0, value=0, key="create_wins")
        losses = st.number_input("Losses", min_value=0, value=0, key="create_losses")
        ties = st.number_input("Ties", min_value=0, value=0, key="create_ties")
        if st.button("Create Team"):
            if team_name and league:
                try:
                    response = requests.post(
                        f"{API_BASE_URL}/teams",
                        json={
                            "name": team_name,
                            "season": season,
                            "league": league,
                            "wins": wins,
                            "losses": losses,
                            "ties": ties,
                            "is_active": 1
                        }
                    )
                    if response.status_code == 200:
                        st.success(f"Team '{team_name}' created successfully!")
                        fetch_teams()  # Refresh teams list
                    else:
                        st.error(f"Failed to create team: {response.text}")
                except requests.RequestException as e:
                    st.error(f"Error connecting to API: {str(e)}")
            else:
                st.warning("Please enter both team name and league")

    # Player Creation
    with st.expander("Add Player", expanded=True):
        teams = fetch_teams()
        if teams:
            # Group teams by season
            teams_by_season = {}
            for team in teams:
                if team["season"] not in teams_by_season:
                    teams_by_season[team["season"]] = []
                teams_by_season[team["season"]].append(team)
            
            # Sort seasons in descending order
            seasons = sorted(teams_by_season.keys(), reverse=True)
            
            # Let user select season first
            selected_season = st.selectbox(
                "Select Season",
                options=seasons,
                key="create_player_season"
            )
            
            # Then show teams for that season
            season_teams = teams_by_season.get(selected_season, [])
            if season_teams:
                team_options = {team["display_name"]: team["id"] for team in season_teams}
                selected_team = st.selectbox(
                    "Select Team",
                    options=list(team_options.keys()),
                    key="create_player_team"
                )
                
                player_name = st.text_input("Player Name", key="create_player_name")
                jersey_number = st.text_input("Jersey Number (Optional)", key="create_player_jersey")
                
                if st.button("Add Player"):
                    if player_name and selected_team:
                        try:
                            response = requests.post(
                                f"{API_BASE_URL}/players",
                                json={
                                    "name": player_name,
                                    "team_name": selected_team.split(" (")[0],  # Remove season from display name
                                    "season": selected_season,
                                    "jersey_number": jersey_number if jersey_number else None,
                                    "is_active": True
                                }
                            )
                            if response.status_code == 200:
                                st.success(f"Player '{player_name}' added to team '{selected_team}'!")
                                fetch_players()  # Refresh players list
                            else:
                                st.error(f"Failed to add player: {response.text}")
                        except requests.RequestException as e:
                            st.error(f"Error connecting to API: {str(e)}")
                    else:
                        st.warning("Please enter player name and select a team")
            else:
                st.warning(f"No teams found for season {selected_season}")
        else:
            st.warning("Please create a team first")

    # View Players by Team
    with st.expander("View Players by Team", expanded=True):
        if teams:
            # Group teams by season for viewing
            teams_by_season = {}
            for team in teams:
                if team["season"] not in teams_by_season:
                    teams_by_season[team["season"]] = []
                teams_by_season[team["season"]].append(team)
            
            # Sort seasons in descending order
            seasons = sorted(teams_by_season.keys(), reverse=True)
            
            # Let user select season first
            selected_view_season = st.selectbox(
                "Select Season",
                options=seasons,
                key="view_players_season"
            )
            
            # Then show teams for that season
            season_teams = teams_by_season.get(selected_view_season, [])
            if season_teams:
                team_options = {team["display_name"]: team["id"] for team in season_teams}
                selected_team_view = st.selectbox(
                    "Select Team to View Players",
                    options=list(team_options.keys()),
                    key="view_players_team"
                )
                
                players = fetch_players()
                team_players = [
                    player for player in players
                    if player["team_id"] == team_options[selected_team_view] and
                    player["season"] == selected_view_season and
                    player["is_active"]
                ]
                
                if team_players:
                    st.write("Active Players:")
                    for player in team_players:
                        st.write(f"- {player['display_name']}")
                else:
                    st.info(f"No active players found for team '{selected_team_view}'")
            else:
                st.info(f"No teams found for season {selected_view_season}")
        else:
            st.info("No teams available")

    # Copy Players Section
    with st.expander("Copy Players", expanded=True):
        if teams:
            st.write("### Copy Players Between Teams")
            st.write("""
            This will help you copy selected players from one team to another.
            Useful when:
            - Moving players to a new season
            - Adding players who play for multiple teams
            """)
            
            # Source Team Selection
            st.write("#### Source Team (Copy From)")
            # Group teams by season for source selection
            source_teams_by_season = {}
            for team in teams:
                if team["season"] not in source_teams_by_season:
                    source_teams_by_season[team["season"]] = []
                source_teams_by_season[team["season"]].append(team)
            
            source_seasons = sorted(source_teams_by_season.keys(), reverse=True)
            source_season = st.selectbox(
                "Select Source Season",
                options=source_seasons,
                key="copy_players_source_season"
            )
            
            source_season_teams = source_teams_by_season.get(source_season, [])
            if source_season_teams:
                source_team_options = {team["display_name"]: team["id"] for team in source_season_teams}
                selected_source_team = st.selectbox(
                    "Select Source Team",
                    options=list(source_team_options.keys()),
                    key="copy_players_source_team"
                )
                source_team_id = source_team_options[selected_source_team]
                
                # Get players from source team
                players = fetch_players()
                source_team_players = [
                    player for player in players
                    if player["team_id"] == source_team_id and
                    player["season"] == source_season and
                    player["is_active"]
                ]
                
                if source_team_players:
                    # Destination Team Selection
                    st.write("#### Destination Team (Copy To)")
                    dest_season = st.selectbox(
                        "Select Destination Season",
                        options=source_seasons,
                        key="copy_players_dest_season"
                    )
                    
                    dest_season_teams = source_teams_by_season.get(dest_season, [])
                    if dest_season_teams:
                        dest_team_options = {team["display_name"]: team["id"] for team in dest_season_teams}
                        selected_dest_team = st.selectbox(
                            "Select Destination Team",
                            options=list(dest_team_options.keys()),
                            key="copy_players_dest_team"
                        )
                        dest_team_id = dest_team_options[selected_dest_team]
                        
                        if source_team_id != dest_team_id or source_season != dest_season:
                            # Player Selection
                            st.write("#### Select Players to Copy")
                            selected_players = []
                            for player in source_team_players:
                                if st.checkbox(
                                    f"{player['name']}{' (#' + player['jersey_number'] + ')' if player['jersey_number'] else ''}",
                                    key=f"player_select_{player['id']}"
                                ):
                                    selected_players.append(player)
                            
                            if selected_players:
                                if st.button("Copy Selected Players", type="primary", key="copy_players_button"):
                                    players_copied = 0
                                    failed_players = []
                                    
                                    for player in selected_players:
                                        try:
                                            # Create new player entry
                                            new_player_data = {
                                                "name": player["name"],
                                                "team_name": selected_dest_team.split(" (")[0],  # Remove season from display name
                                                "season": dest_season,
                                                "jersey_number": player["jersey_number"],
                                                "is_active": True
                                            }
                                            
                                            response = requests.post(
                                                f"{API_BASE_URL}/players",
                                                json=new_player_data
                                            )
                                            
                                            if response.status_code == 200:
                                                players_copied += 1
                                            else:
                                                failed_players.append(player["name"])
                                        except Exception as e:
                                            failed_players.append(player["name"])
                                            st.error(f"Error copying player {player['name']}: {str(e)}")
                                    
                                    if players_copied > 0:
                                        st.success(f"Successfully copied {players_copied} players!")
                                        if failed_players:
                                            st.warning(f"Failed to copy some players: {', '.join(failed_players)}")
                                        # Refresh players list
                                        fetch_players_force()
                                    else:
                                        st.error("Failed to copy players.")
                                        if failed_players:
                                            st.error(f"Failed players: {', '.join(failed_players)}")
                        else:
                            st.warning("Source and destination teams must be different")
                    else:
                        st.info(f"No teams found in season {dest_season}")
                else:
                    st.info("No active players found in the source team")
            else:
                st.info(f"No teams found in season {source_season}")
        else:
            st.info("No teams available")

    # Update Team
    with st.expander("Update Team", expanded=True):
        if teams:
            # Group teams by season for updating
            teams_by_season = {}
            for team in teams:
                if team["season"] not in teams_by_season:
                    teams_by_season[team["season"]] = []
                teams_by_season[team["season"]].append(team)
            
            # Sort seasons in descending order
            seasons = sorted(teams_by_season.keys(), reverse=True)
            
            # Let user select season first
            selected_update_season = st.selectbox(
                "Select Season",
                options=seasons,
                key="update_team_season"
            )
            
            # Then show teams for that season
            season_teams = teams_by_season.get(selected_update_season, [])
            if season_teams:
                team_options = {team["display_name"]: team["id"] for team in season_teams}
                selected_team_update = st.selectbox(
                    "Select Team to Update",
                    options=list(team_options.keys()),
                    key="update_team_select"
                )
                
                # Get current team data
                selected_team_data = next(
                    (team for team in teams if team["display_name"] == selected_team_update),
                    None
                )
                
                if selected_team_data:
                    st.subheader("Edit Team Details")
                    with st.form(key="update_team_form"):
                        updated_name = st.text_input(
                            "Team Name",
                            value=selected_team_data["name"],
                            key="update_name"
                        )
                        updated_season = st.number_input(
                            "Season",
                            min_value=1,
                            value=selected_team_data["season"],
                            key="update_season"
                        )
                        updated_league = st.text_input(
                            "League",
                            value=selected_team_data["league"],
                            key="update_league"
                        )
                        updated_wins = st.number_input(
                            "Wins",
                            min_value=0,
                            value=selected_team_data["wins"],
                            key="update_wins"
                        )
                        updated_losses = st.number_input(
                            "Losses",
                            min_value=0,
                            value=selected_team_data["losses"],
                            key="update_losses"
                        )
                        updated_ties = st.number_input(
                            "Ties",
                            min_value=0,
                            value=selected_team_data["ties"],
                            key="update_ties"
                        )
                        
                        # Add some space before the submit button
                        st.write("")
                        submitted = st.form_submit_button(
                            "💾 Save Team Changes",
                            use_container_width=True
                        )
                        
                        if submitted:
                            try:
                                response = requests.put(
                                    f"{API_BASE_URL}/teams/{selected_team_data['id']}",
                                    json={
                                        "name": updated_name,
                                        "season": updated_season,
                                        "league": updated_league,
                                        "wins": updated_wins,
                                        "losses": updated_losses,
                                        "ties": updated_ties,
                                        "is_active": selected_team_data["is_active"]
                                    },
                                    params={"version": selected_team_data["version"]}
                                )
                                if response.status_code == 200:
                                    st.success(f"Team '{updated_name}' updated successfully!")
                                    fetch_teams()  # Refresh teams list
                                else:
                                    st.error(f"Failed to update team: {response.text}")
                            except requests.RequestException as e:
                                st.error(f"Error connecting to API: {str(e)}")
            else:
                st.info(f"No teams found for season {selected_update_season}")
        else:
            st.info("No teams available to update")

def game_management():
    """Handle game creation and viewing"""
    st.header("Game Management")
    
    # Get unique seasons from games
    games = fetch_games()
    seasons = sorted(list(set(game["season"] for game in games)), reverse=True) if games else []
    
    # Season selection at the top
    selected_season = st.selectbox("Select Season", options=seasons) if seasons else None
    
    if not selected_season:
        st.warning("No games available in any season.")
        return
    
    # Create Game
    st.subheader("Create Game")
    teams = fetch_teams()
    if len(teams) >= 2:
        # Filter teams by selected season
        season_teams = [team for team in teams if team["season"] == selected_season]
        if not season_teams:
            st.warning(f"No teams found for season {selected_season}")
            return
            
        # Get leagues for this season
        season_leagues = sorted(list(set(team["league"] for team in season_teams)))
        league = st.selectbox("League", options=season_leagues)
        
        week = st.number_input("Week", min_value=1, value=1)

        # Get existing games for this week and season
        week_games = [g for g in games if g["season"] == selected_season and g["week"] == week]
        teams_with_games = set()
        for game in week_games:
            teams_with_games.add(game["team1_name"])
            teams_with_games.add(game["team2_name"])
        
        # Filter out teams that already have games this week
        available_teams = [team["name"] for team in season_teams if team["name"] not in teams_with_games]
        if not available_teams:
            st.warning(f"All teams already have games scheduled for week {week}")
            return
            
        # Create team options only from available teams
        team1 = st.selectbox("Team 1", options=available_teams, key="team1")
        # Remove selected team1 from team2 options
        team2_options = [t for t in available_teams if t != team1]
        if not team2_options:
            st.warning("No available teams for Team 2 selection")
            return
        team2 = st.selectbox("Team 2", options=team2_options, key="team2")
        
        team1_score = st.number_input("Team 1 Score", min_value=0, value=0, key="team1_score")
        team2_score = st.number_input("Team 2 Score", min_value=0, value=0, key="team2_score")
        
        # Determine winning team based on scores
        winning_team = None
        if team1_score > team2_score:
            winning_team = team1
        elif team2_score > team1_score:
            winning_team = team2
        
        if st.button("Create Game"):
            try:
                response = requests.post(
                    f"{API_BASE_URL}/games",
                    json={
                        "week": week,
                        "league": league,
                        "season": selected_season,
                        "team1_name": team1,
                        "team1_score": team1_score,
                        "team2_name": team2,
                        "team2_score": team2_score,
                        "winning_team_name": winning_team
                    }
                )
                if response.status_code == 200:
                    st.success("Game created successfully!")
                    fetch_games()  # Refresh games list
                else:
                    st.error(f"Failed to create game: {response.text}")
            except requests.RequestException as e:
                st.error(f"Error connecting to API: {str(e)}")
    else:
        st.warning("Please create at least two teams first")

    # View Past Games
    st.subheader(f"Season {selected_season} Games")
    
    # Filter games for selected season
    season_games = [g for g in games if g["season"] == selected_season]
    
    if season_games:
        # Group games by week
        games_by_week = {}
        for game in season_games:
            if game["week"] not in games_by_week:
                games_by_week[game["week"]] = []
            games_by_week[game["week"]].append(game)
        
        # Display games by week
        for week in sorted(games_by_week.keys()):
            with st.expander(f"Week {week}", expanded=True):
                for game in sorted(games_by_week[week], key=lambda x: x["league"]):
                    # Create columns for better layout
                    col1, col2, col3 = st.columns([2, 3, 2])
                    with col1:
                        st.write(game["league"])
                    with col2:
                        # Format the game score with team names and scores
                        score_text = (
                            f"**{game['team1_name']}** ({game['team1_score']}) vs "
                            f"**{game['team2_name']}** ({game['team2_score']})"
                        )
                        st.markdown(score_text)
                    with col3:
                        if game["winning_team_name"]:
                            st.write(f"Winner: {game['winning_team_name']}")
                        if game["completed"]:
                            st.write("✓ Completed")
                    st.markdown("---")
    else:
        st.info(f"No games available for Season {selected_season}")

def stat_entry():
    """Handle stat entry for games"""
    st.header("Stat Entry")
    # Initialize session state for player forms if not exists
    if 'qb_forms' not in st.session_state:
        st.session_state.qb_forms = [0]  # List of form indices
    if 'rec_forms' not in st.session_state:
        st.session_state.rec_forms = [0]
    if 'rush_forms' not in st.session_state:
        st.session_state.rush_forms = [0]
    if 'def_forms' not in st.session_state:
        st.session_state.def_forms = [0]
    games = fetch_games()
    if games:
        # --- NEW: Add season filter ---
        seasons = sorted(list(set(g["season"] for g in games)), reverse=True)
        selected_season = st.selectbox("Select Season", options=seasons, key="stat_entry_season_select")
        season_games = [g for g in games if g["season"] == selected_season]
        if not season_games:
            st.warning(f"No games available for season {selected_season}.")
            return
        # Convert game data for selectbox (only for selected season)
        game_options = {
            f"Week {game['week']} - {game['league']} Season {game['season']}: {game['team1_name']} vs {game['team2_name']}": game['id']
            for game in season_games
        }
        selected_game = st.selectbox("Select Game", options=list(game_options.keys()))
        selected_game_id = game_options[selected_game]
        # Fetch the selected game object to check if it's completed
        selected_game_obj = next((g for g in games if g["id"] == selected_game_id), None)
        is_completed = selected_game_obj.get("completed", False) if selected_game_obj else False
        if is_completed:
            st.warning("This game is marked as complete. Stat entry is disabled.")
            return  # Return instead of st.stop()
        # Fetch all stats for this game ONCE and store in session state
        stats_key = f"player_stats_by_id_{selected_game_id}"
        if stats_key not in st.session_state:
            try:
                resp = requests.get(f"{API_BASE_URL}/stats/batch/?game_id={selected_game_id}")
                if resp.status_code == 200:
                    stats_list = resp.json()
                    st.session_state[stats_key] = {s["player_id"]: s for s in stats_list}
                else:
                    st.session_state[stats_key] = {}
            except Exception:
                st.session_state[stats_key] = {}
        player_stats_by_id = st.session_state[stats_key]
        players = fetch_players()
        # Filter players to only show active players from the current season
        season_players = [p for p in players if p["season"] == selected_season and p["is_active"]]
        if season_players:
            # Create tabs for different stat categories
            qb_tab, rec_tab, rush_tab, def_tab = st.tabs(["QB Stats", "Receiver Stats", "Rushing Stats", "Defense Stats"])
            with qb_tab:
                st.subheader("QB Stats Entry")
                col1, col2 = st.columns([1, 3])
                with col1:
                    if st.button("➕", key="add_qb"):
                        new_index = max(st.session_state.qb_forms) + 1 if st.session_state.qb_forms else 0
                        st.session_state.qb_forms.append(new_index)
                with col2:
                    if st.button("Mark Game as Complete", key="mark_game_complete", use_container_width=True):
                        response = requests.put(f"{API_BASE_URL}/games/{selected_game_id}/complete")
                        if response.status_code == 200:
                            st.success("Game marked as complete!")
                            st.cache_data.clear()
                            st.rerun()
                        else:
                            st.error("Failed to mark game as complete.")
                for i in st.session_state.qb_forms:
                    with st.container():
                        col1, col2 = st.columns([6, 1])
                        with col1:
                            st.markdown(f"**QB #{i+1}**")
                        with col2:
                            if st.button("🗑️", key=f"remove_qb_{i}"):
                                st.session_state.qb_forms.remove(i)
                                st.rerun()
                        qb_player = st.selectbox(
                            "Select QB",
                            options=[player["name"] for player in season_players],
                            key=f"qb_player_{i}"
                        )
                        qb_id = next((p["id"] for p in season_players if p["name"] == qb_player), None)
                        current_stats = player_stats_by_id.get(qb_id, None)
                        with st.form(key=f"qb_form_{i}"):
                            row1 = st.columns(3)
                            with row1[0]:
                                st.markdown("**Pass TDs**")
                                pass_tds = st.number_input("", min_value=0, key=f"qb_pass_tds_{i}", label_visibility="collapsed", value=current_stats.get("passing_tds", 0) if current_stats else 0)
                            with row1[1]:
                                st.markdown("**Completions**")
                                completions = st.number_input("", min_value=0, key=f"qb_completions_{i}", label_visibility="collapsed", value=current_stats.get("passes_completed", 0) if current_stats else 0)
                            with row1[2]:
                                st.markdown("**Attempts**")
                                attempts = st.number_input("", min_value=0, key=f"qb_attempts_{i}", label_visibility="collapsed", value=current_stats.get("passes_attempted", 0) if current_stats else 0)
                            row2 = st.columns(3)
                            with row2[0]:
                                st.markdown("**INTs**")
                                ints = st.number_input("", min_value=0, key=f"qb_ints_{i}", label_visibility="collapsed", value=current_stats.get("interceptions_thrown", 0) if current_stats else 0)
                            with row2[1]:
                                st.markdown("**QB Rush TDs**")
                                qb_rush_tds = st.number_input("", min_value=0, key=f"qb_rush_tds_{i}", label_visibility="collapsed", value=current_stats.get("qb_rushing_tds", 0) if current_stats else 0)
                            with row2[2]:
                                st.markdown("**First Downs**")
                                first_downs = st.number_input("", min_value=0, key=f"qb_first_downs_{i}", label_visibility="collapsed", value=current_stats.get("first_downs", 0) if current_stats else 0)
                            submitted = st.form_submit_button("Log QB Stats", use_container_width=True)
                            if submitted:
                                if qb_id:
                                    try:
                                        # First get current stats for this player in this game
                                        current_player_stats = player_stats_by_id.get(qb_id, {})
                                        
                                        # Merge new stats with existing ones
                                        updated_stats = {
                                            "player_id": qb_id,
                                            "game_id": selected_game_id,
                                            "passing_tds": pass_tds,
                                            "passes_completed": completions,
                                            "passes_attempted": attempts,
                                            "interceptions_thrown": ints,
                                            "qb_rushing_tds": qb_rush_tds,
                                            "first_downs": first_downs,
                                            # Preserve other existing stats
                                            "receptions": current_player_stats.get("receptions", 0),
                                            "targets": current_player_stats.get("targets", 0),
                                            "receiving_tds": current_player_stats.get("receiving_tds", 0),
                                            "drops": current_player_stats.get("drops", 0),
                                            "rushing_tds": current_player_stats.get("rushing_tds", 0),
                                            "rush_attempts": current_player_stats.get("rush_attempts", 0),
                                            "flag_pulls": current_player_stats.get("flag_pulls", 0),
                                            "interceptions": current_player_stats.get("interceptions", 0),
                                            "pass_breakups": current_player_stats.get("pass_breakups", 0),
                                            "def_td": current_player_stats.get("def_td", 0),
                                            "sacks": current_player_stats.get("sacks", 0)
                                        }
                                        
                                        response = requests.post(
                                            f"{API_BASE_URL}/stats/",
                                            json=updated_stats
                                        )
                                        if response.status_code == 200:
                                            st.success(f"QB Stats logged for {qb_player}!")
                                            # Re-fetch all stats for this game to ensure UI is up to date
                                            try:
                                                resp = requests.get(f"{API_BASE_URL}/stats/batch/?game_id={selected_game_id}")
                                                if resp.status_code == 200:
                                                    stats_list = resp.json()
                                                    st.session_state[stats_key] = {s["player_id"]: s for s in stats_list}
                                                    # Update our local copy too
                                                    player_stats_by_id = st.session_state[stats_key]
                                            except Exception:
                                                pass
                                        else:
                                            st.error("Failed to log QB stats")
                                    except requests.RequestException as e:
                                        st.error(f"Error connecting to API: {str(e)}")
                        st.markdown("---")
            # Repeat the same pattern for Receiver, Rushing, and Defense tabs:
            with rec_tab:
                st.subheader("Receiver Stats Entry")
                col1, col2 = st.columns([1, 10])
                with col1:
                    if st.button("➕", key="add_rec"):
                        new_index = max(st.session_state.rec_forms) + 1 if st.session_state.rec_forms else 0
                        st.session_state.rec_forms.append(new_index)
                for i in st.session_state.rec_forms:
                    with st.container():
                        col1, col2 = st.columns([6, 1])
                        with col1:
                            st.markdown(f"**Receiver #{i+1}**")
                        with col2:
                            if st.button("🗑️", key=f"remove_rec_{i}"):
                                st.session_state.rec_forms.remove(i)
                                st.rerun()
                        rec_player = st.selectbox(
                            "Select Receiver",
                            options=[player["name"] for player in season_players],
                            key=f"rec_player_{i}"
                        )
                        rec_id = next((p["id"] for p in season_players if p["name"] == rec_player), None)
                        current_stats = player_stats_by_id.get(rec_id, None)
                        with st.form(key=f"rec_form_{i}"):
                            cols = st.columns([2, 2, 2, 2, 2])
                            with cols[0]:
                                st.markdown("**Receptions**")
                                receptions = st.number_input("", min_value=0, key=f"rec_receptions_{i}", label_visibility="collapsed", value=current_stats.get("receptions", 0) if current_stats else 0)
                            with cols[1]:
                                st.markdown("**Targets**")
                                targets = st.number_input("", min_value=0, key=f"rec_targets_{i}", label_visibility="collapsed", value=current_stats.get("targets", 0) if current_stats else 0)
                            with cols[2]:
                                st.markdown("**Receiving TDs**")
                                tds = st.number_input("", min_value=0, key=f"rec_tds_{i}", label_visibility="collapsed", value=current_stats.get("receiving_tds", 0) if current_stats else 0)
                            with cols[3]:
                                st.markdown("**Drops**")
                                drops = st.number_input("", min_value=0, key=f"rec_drops_{i}", label_visibility="collapsed", value=current_stats.get("drops", 0) if current_stats else 0)
                            with cols[4]:
                                st.markdown("**First Downs**")
                                first_downs = st.number_input("", min_value=0, key=f"rec_first_downs_{i}", label_visibility="collapsed", value=current_stats.get("first_downs", 0) if current_stats else 0)
                            submitted = st.form_submit_button("Log Receiver Stats", use_container_width=True)
                            if submitted:
                                if rec_id:
                                    try:
                                        # First get current stats for this player in this game
                                        current_player_stats = player_stats_by_id.get(rec_id, {})
                                        
                                        # Merge new stats with existing ones
                                        updated_stats = {
                                            "player_id": rec_id,
                                            "game_id": selected_game_id,
                                            "receptions": receptions,
                                            "targets": targets,
                                            "receiving_tds": tds,
                                            "drops": drops,
                                            "first_downs": first_downs,
                                            # Preserve other existing stats
                                            "passing_tds": current_player_stats.get("passing_tds", 0),
                                            "passes_completed": current_player_stats.get("passes_completed", 0),
                                            "passes_attempted": current_player_stats.get("passes_attempted", 0),
                                            "interceptions_thrown": current_player_stats.get("interceptions_thrown", 0),
                                            "qb_rushing_tds": current_player_stats.get("qb_rushing_tds", 0),
                                            "rushing_tds": current_player_stats.get("rushing_tds", 0),
                                            "rush_attempts": current_player_stats.get("rush_attempts", 0),
                                            "flag_pulls": current_player_stats.get("flag_pulls", 0),
                                            "interceptions": current_player_stats.get("interceptions", 0),
                                            "pass_breakups": current_player_stats.get("pass_breakups", 0),
                                            "def_td": current_player_stats.get("def_td", 0),
                                            "sacks": current_player_stats.get("sacks", 0)
                                        }
                                        
                                        response = requests.post(
                                            f"{API_BASE_URL}/stats/",
                                            json=updated_stats
                                        )
                                        if response.status_code == 200:
                                            st.success(f"Receiver Stats logged for {rec_player}!")
                                            try:
                                                resp = requests.get(f"{API_BASE_URL}/stats/batch/?game_id={selected_game_id}")
                                                if resp.status_code == 200:
                                                    stats_list = resp.json()
                                                    st.session_state[stats_key] = {s["player_id"]: s for s in stats_list}
                                                    # Update our local copy too
                                                    player_stats_by_id = st.session_state[stats_key]
                                            except Exception:
                                                pass
                                        else:
                                            st.error("Failed to log receiver stats")
                                    except requests.RequestException as e:
                                        st.error(f"Error connecting to API: {str(e)}")
                        st.markdown("---")
            with rush_tab:
                st.subheader("Rushing Stats Entry")
                col1, col2 = st.columns([1, 10])
                with col1:
                    if st.button("➕", key="add_rush"):
                        new_index = max(st.session_state.rush_forms) + 1 if st.session_state.rush_forms else 0
                        st.session_state.rush_forms.append(new_index)
                for i in st.session_state.rush_forms:
                    with st.container():
                        col1, col2 = st.columns([6, 1])
                        with col1:
                            st.markdown(f"**Rusher #{i+1}**")
                        with col2:
                            if st.button("🗑️", key=f"remove_rush_{i}"):
                                st.session_state.rush_forms.remove(i)
                                st.rerun()
                        rush_player = st.selectbox(
                            "Select Rusher",
                            options=[player["name"] for player in season_players],
                            key=f"rush_player_{i}"
                        )
                        rush_id = next((p["id"] for p in season_players if p["name"] == rush_player), None)
                        current_stats = player_stats_by_id.get(rush_id, None)
                        with st.form(key=f"rush_form_{i}"):
                            cols = st.columns([3, 3, 3])
                            with cols[0]:
                                st.markdown("**Attempts**")
                                attempts = st.number_input("", min_value=0, key=f"rush_attempts_{i}", label_visibility="collapsed", value=current_stats.get("rush_attempts", 0) if current_stats else 0)
                            with cols[1]:
                                st.markdown("**Rushing TDs**")
                                tds = st.number_input("", min_value=0, key=f"rush_tds_{i}", label_visibility="collapsed", value=current_stats.get("rushing_tds", 0) if current_stats else 0)
                            with cols[2]:
                                st.markdown("**First Downs**")
                                first_downs = st.number_input("", min_value=0, key=f"rush_first_downs_{i}", label_visibility="collapsed", value=current_stats.get("first_downs", 0) if current_stats else 0)
                            submitted = st.form_submit_button("Log Rushing Stats", use_container_width=True)
                            if submitted:
                                if rush_id:
                                    try:
                                        # First get current stats for this player in this game
                                        current_player_stats = player_stats_by_id.get(rush_id, {})
                                        
                                        # Merge new stats with existing ones
                                        updated_stats = {
                                            "player_id": rush_id,
                                            "game_id": selected_game_id,
                                            "rush_attempts": attempts,
                                            "rushing_tds": tds,
                                            "first_downs": first_downs,
                                            # Preserve other existing stats
                                            "passing_tds": current_player_stats.get("passing_tds", 0),
                                            "passes_completed": current_player_stats.get("passes_completed", 0),
                                            "passes_attempted": current_player_stats.get("passes_attempted", 0),
                                            "interceptions_thrown": current_player_stats.get("interceptions_thrown", 0),
                                            "qb_rushing_tds": current_player_stats.get("qb_rushing_tds", 0),
                                            "receptions": current_player_stats.get("receptions", 0),
                                            "targets": current_player_stats.get("targets", 0),
                                            "receiving_tds": current_player_stats.get("receiving_tds", 0),
                                            "drops": current_player_stats.get("drops", 0),
                                            "flag_pulls": current_player_stats.get("flag_pulls", 0),
                                            "interceptions": current_player_stats.get("interceptions", 0),
                                            "pass_breakups": current_player_stats.get("pass_breakups", 0),
                                            "def_td": current_player_stats.get("def_td", 0),
                                            "sacks": current_player_stats.get("sacks", 0)
                                        }
                                        
                                        response = requests.post(
                                            f"{API_BASE_URL}/stats/",
                                            json=updated_stats
                                        )
                                        if response.status_code == 200:
                                            st.success(f"Rushing Stats logged for {rush_player}!")
                                            try:
                                                resp = requests.get(f"{API_BASE_URL}/stats/batch/?game_id={selected_game_id}")
                                                if resp.status_code == 200:
                                                    stats_list = resp.json()
                                                    st.session_state[stats_key] = {s["player_id"]: s for s in stats_list}
                                                    # Update our local copy too
                                                    player_stats_by_id = st.session_state[stats_key]
                                            except Exception:
                                                pass
                                        else:
                                            st.error("Failed to log rushing stats")
                                    except requests.RequestException as e:
                                        st.error(f"Error connecting to API: {str(e)}")
                        st.markdown("---")
            with def_tab:
                st.subheader("Defense Stats Entry")
                col1, col2 = st.columns([1, 10])
                with col1:
                    if st.button("➕", key="add_def"):
                        new_index = max(st.session_state.def_forms) + 1 if st.session_state.def_forms else 0
                        st.session_state.def_forms.append(new_index)
                for i in st.session_state.def_forms:
                    with st.container():
                        col1, col2 = st.columns([6, 1])
                        with col1:
                            st.markdown(f"**Defender #{i+1}**")
                        with col2:
                            if st.button("🗑️", key=f"remove_def_{i}"):
                                st.session_state.def_forms.remove(i)
                                st.rerun()
                        def_player = st.selectbox(
                            "Select Defender",
                            options=[player["name"] for player in season_players],
                            key=f"def_player_{i}"
                        )
                        def_id = next((p["id"] for p in season_players if p["name"] == def_player), None)
                        current_stats = player_stats_by_id.get(def_id, None)
                        with st.form(key=f"def_form_{i}"):
                            cols = st.columns([2, 2, 2, 2, 2])
                            with cols[0]:
                                st.markdown("**Flag Pulls**")
                                flag_pulls = st.number_input("", min_value=0, key=f"def_flag_pulls_{i}", label_visibility="collapsed", value=current_stats.get("flag_pulls", 0) if current_stats else 0)
                            with cols[1]:
                                st.markdown("**Interceptions**")
                                interceptions = st.number_input("", min_value=0, key=f"def_interceptions_{i}", label_visibility="collapsed", value=current_stats.get("interceptions", 0) if current_stats else 0)
                            with cols[2]:
                                st.markdown("**Pass Breakups**")
                                pass_breakups = st.number_input("", min_value=0, key=f"def_pass_breakups_{i}", label_visibility="collapsed", value=current_stats.get("pass_breakups", 0) if current_stats else 0)
                            with cols[3]:
                                st.markdown("**Defensive TDs**")
                                def_td = st.number_input("", min_value=0, key=f"def_td_{i}", label_visibility="collapsed", value=current_stats.get("def_td", 0) if current_stats else 0)
                            with cols[4]:
                                st.markdown("**Sacks**")
                                sacks = st.number_input("", min_value=0, key=f"def_sacks_{i}", label_visibility="collapsed", value=current_stats.get("sacks", 0) if current_stats else 0)
                            submitted = st.form_submit_button("Log Defense Stats", use_container_width=True)
                            if submitted:
                                if def_id:
                                    try:
                                        # First get current stats for this player in this game
                                        current_player_stats = player_stats_by_id.get(def_id, {})
                                        
                                        # Merge new stats with existing ones
                                        updated_stats = {
                                            "player_id": def_id,
                                            "game_id": selected_game_id,
                                            "flag_pulls": flag_pulls,
                                            "interceptions": interceptions,
                                            "pass_breakups": pass_breakups,
                                            "def_td": def_td,
                                            "sacks": sacks,
                                            # Preserve other existing stats
                                            "passing_tds": current_player_stats.get("passing_tds", 0),
                                            "passes_completed": current_player_stats.get("passes_completed", 0),
                                            "passes_attempted": current_player_stats.get("passes_attempted", 0),
                                            "interceptions_thrown": current_player_stats.get("interceptions_thrown", 0),
                                            "qb_rushing_tds": current_player_stats.get("qb_rushing_tds", 0),
                                            "receptions": current_player_stats.get("receptions", 0),
                                            "targets": current_player_stats.get("targets", 0),
                                            "receiving_tds": current_player_stats.get("receiving_tds", 0),
                                            "drops": current_player_stats.get("drops", 0),
                                            "rushing_tds": current_player_stats.get("rushing_tds", 0),
                                            "rush_attempts": current_player_stats.get("rush_attempts", 0),
                                            "first_downs": current_player_stats.get("first_downs", 0)
                                        }
                                        
                                        response = requests.post(
                                            f"{API_BASE_URL}/stats/",
                                            json=updated_stats
                                        )
                                        if response.status_code == 200:
                                            st.success(f"Defense Stats logged for {def_player}!")
                                            try:
                                                resp = requests.get(f"{API_BASE_URL}/stats/batch/?game_id={selected_game_id}")
                                                if resp.status_code == 200:
                                                    stats_list = resp.json()
                                                    st.session_state[stats_key] = {s["player_id"]: s for s in stats_list}
                                                    # Update our local copy too
                                                    player_stats_by_id = st.session_state[stats_key]
                                            except Exception:
                                                pass
                                        else:
                                            st.error("Failed to log defense stats")
                                    except requests.RequestException as e:
                                        st.error(f"Error connecting to API: {str(e)}")
                        st.markdown("---")
        else:
            st.warning("No players available")
    else:
        st.warning("No games available")

def standings_management():
    """Handle team standings display"""
    st.header("Standings")
    
    # Always fetch fresh teams data
    try:
        response = requests.get(f"{API_BASE_URL}/teams")
        if response.status_code == 200:
            teams = response.json()
        else:
            st.error("Failed to fetch teams")
            teams = []
    except requests.RequestException as e:
        st.error(f"Error connecting to API: {str(e)}")
        teams = []
    if teams:
        st.markdown("""
            <style>
                .standings-header {
                    font-size: 28px !important;
                    font-weight: bold !important;
                    color: #ffffff !important;
                    padding: 10px 0 !important;
                    text-align: center !important;
                    border-bottom: 2px solid #4a90e2 !important;
                    margin-bottom: 20px !important;
                    background-color: #1e1e1e !important;
                }
                .dataframe {
                    width: 100% !important;
                    font-size: 18px !important;
                    background-color: #1e1e1e !important;
                    border-collapse: collapse !important;
                    border: 1px solid #333333 !important;
                    color: #ffffff !important;
                }
                .dataframe th {
                    background-color: #4a90e2 !important;
                    color: white !important;
                    text-align: center !important;
                    padding: 12px !important;
                    border: 1px solid #333333 !important;
                }
                .dataframe td {
                    text-align: center !important;
                    padding: 10px !important;
                    border: 1px solid #333333 !important;
                }
                .dataframe tr {
                    background-color: #1e1e1e !important;
                }
                .dataframe tr:nth-child(even) {
                    background-color: #2d2d2d !important;
                }
                .dataframe tr:hover {
                    background-color: #3d3d3d !important;
                }
            </style>
        """, unsafe_allow_html=True)
        
        # Group teams by league and season
        team_groups = {}
        for team in teams:
            if team["is_active"]:  # Only show active teams
                key = (team["league"], team["season"])
                if key not in team_groups:
                    team_groups[key] = []
                team_groups[key].append(team)
        
        # Sort keys by season (descending) and then league
        sorted_keys = sorted(team_groups.keys(), key=lambda x: (-x[1], x[0]))
        
        # Display standings for each league/season
        for (league, season) in sorted_keys:
            league_teams = team_groups[(league, season)]
            with st.expander(f"{league} - Season {season}", expanded=True):
                # Add the styled header
                st.markdown(f'<div class="standings-header">{league} - Season {season}</div>', unsafe_allow_html=True)
                
                # Sort teams by win percentage
                sorted_teams = sorted(
                    league_teams,
                    key=lambda x: (
                        (x["wins"] + 0.5 * x["ties"]) / (x["wins"] + x["losses"] + x["ties"]) if (x["wins"] + x["losses"] + x["ties"]) > 0 else 0,
                        x["wins"],
                        -x["losses"]
                    ),
                    reverse=True
                )
                
                # Create a table of standings
                standings_data = []
                current_rank = 1
                previous_record = None
                tied_teams = 1

                for i, team in enumerate(sorted_teams):
                    games_played = team["wins"] + team["losses"] + team["ties"]
                    win_pct = (team["wins"] + 0.5 * team["ties"]) / games_played if games_played > 0 else 0.000
                    current_record = (win_pct, team["wins"], -team["losses"])
                    
                    # Check if this team is tied with the previous team
                    if previous_record and previous_record == current_record:
                        tied_teams += 1
                    else:
                        current_rank = i + 1 - (tied_teams - 1)
                        tied_teams = 1
                    
                    rank_display = f"T-{current_rank}" if tied_teams > 1 else str(current_rank)
                    
                    standings_data.append({
                        "Rank": rank_display,
                        "Team": team["name"],
                        "W": team["wins"],
                        "L": team["losses"],
                        "T": team["ties"],
                        "PCT": f"{win_pct:.3f}",
                        "GP": games_played
                    })
                    
                    previous_record = current_record
                
                if standings_data:
                    # Convert to DataFrame and display with custom styling
                    df = pd.DataFrame(standings_data)
                    st.write(df.to_html(index=False, classes=['dataframe'], escape=False), unsafe_allow_html=True)
                else:
                    st.info(f"No teams found in {league} for season {season}")
    else:
        st.info("No teams available")

def season_management():
    """Handle season transitions and management"""
    st.header("Season Management")
    
    # Always fetch fresh teams data
    try:
        response = requests.get(f"{API_BASE_URL}/teams")
        if response.status_code == 200:
            teams = response.json()
        else:
            st.error("Failed to fetch teams")
            teams = []
    except requests.RequestException as e:
        st.error(f"Error connecting to API: {str(e)}")
        teams = []
    if teams:
        # Get all seasons (both active and inactive)
        all_seasons = sorted(list(set(team["season"] for team in teams)))
        active_seasons = sorted(list(set(
            team["season"] for team in teams 
            if team["is_active"] == 1
        )))
        
        # End Season Section
        with st.expander("End Current Season", expanded=True):
            if active_seasons:
                st.write("### End Current Season")
                st.write("""
                This will mark all teams from the selected season as inactive. 
                This should be done when transitioning to a new season. 
                Teams that will continue in the new season can be copied over using the 'Start New Season' section below.
                """)
                
                selected_season = st.selectbox(
                    "Select Season to End",
                    options=active_seasons,
                    key="end_season_select"
                )
                
                if st.button("End Selected Season", type="primary"):
                    try:
                        # Get all active teams for the selected season
                        season_teams = [team for team in teams if team["season"] == selected_season and team["is_active"]]
                        
                        if not season_teams:
                            st.warning(f"No active teams found for season {selected_season}")
                            return
                        
                        teams_updated = 0
                        failed_teams = []
                        players_updated = 0
                        failed_players = []
                        
                        # First, get all active players for this season
                        players = fetch_players()
                        season_players = [
                            player for player in players 
                            if player["season"] == selected_season and player["is_active"]
                        ]
                        
                        # Update each team's active status
                        for team in season_teams:
                            try:
                                # Prepare the update data
                                update_data = {
                                    "name": team["name"],
                                    "season": team["season"],
                                    "league": team["league"],
                                    "wins": team["wins"],
                                    "losses": team["losses"],
                                    "ties": team["ties"],
                                    "is_active": 0  # Set to inactive
                                }
                                
                                # Send PUT request to update the team
                                response = requests.put(
                                    f"{API_BASE_URL}/teams/{team['id']}",
                                    json=update_data,
                                    params={"version": team["version"]}
                                )
                                
                                if response.status_code == 200:
                                    teams_updated += 1
                                else:
                                    failed_teams.append(team["name"])
                            except Exception as e:
                                failed_teams.append(team["name"])
                                st.error(f"Error updating team {team['name']}: {str(e)}")
                        
                        # Update each player's active status
                        for player in season_players:
                            try:
                                # Prepare the update data
                                update_data = {
                                    "name": player["name"],
                                    "team_name": player["team_name"],
                                    "season": player["season"],
                                    "jersey_number": player["jersey_number"],
                                    "is_active": False  # Set to inactive
                                }
                                
                                # Send PUT request to update the player
                                response = requests.put(
                                    f"{API_BASE_URL}/players/{player['id']}",
                                    json=update_data,
                                    params={"version": player["version"]}
                                )
                                
                                if response.status_code == 200:
                                    players_updated += 1
                                else:
                                    failed_players.append(player["name"])
                            except Exception as e:
                                failed_players.append(player["name"])
                                st.error(f"Error updating player {player['name']}: {str(e)}")
                        
                        # Show results
                        if teams_updated > 0 or players_updated > 0:
                            st.success(f"""Successfully ended Season {selected_season}:
                            - {teams_updated} teams marked as inactive
                            - {players_updated} players marked as inactive""")
                            
                            if failed_teams:
                                st.warning(f"Failed to update some teams: {', '.join(failed_teams)}")
                            if failed_players:
                                st.warning(f"Failed to update some players: {', '.join(failed_players)}")
                                
                            st.info("You can now create new teams for the next season.")
                            # Clear caches to refresh data
                            fetch_teams_force()
                            fetch_players_force()
                        else:
                            st.error("Failed to end season. No teams or players were updated.")
                            if failed_teams:
                                st.error(f"Failed teams: {', '.join(failed_teams)}")
                            if failed_players:
                                st.error(f"Failed players: {', '.join(failed_players)}")
                    except Exception as e:
                        st.error(f"Error ending season: {str(e)}")
            else:
                st.info("No active seasons found.")
        
        # Start New Season Section
        with st.expander("Start New Season", expanded=True):
            st.write("### Start New Season")
            st.write("""
            This will help you set up a new season by copying selected teams from a previous season.
            The selected teams will be created with:
            - Same name and league
            - Reset records (0 wins, 0 losses, 0 ties)
            - Active status
            
            Note: Players are not copied over - you'll need to add players to the teams separately.
            """)
            
            # Select source season
            source_season = st.selectbox(
                "Copy Teams From Season",
                options=all_seasons,
                key="copy_from_season"
            )
            
            # Get teams from selected season
            source_teams = [team for team in teams if team["season"] == source_season]
            if not source_teams:
                st.warning(f"No teams found in season {source_season}")
                return
                
            # Let user select which teams to copy
            st.write("#### Select Teams to Copy")
            selected_teams = []
            for team in source_teams:
                if st.checkbox(f"{team['name']} ({team['league']})", key=f"team_select_{team['id']}"):
                    selected_teams.append(team)
            
            if not selected_teams:
                st.warning("Please select at least one team to copy")
            else:
                # Calculate next season number
                next_season = max(all_seasons) + 1 if all_seasons else 1
                
                # Input for new season
                new_season = st.number_input(
                    "New Season Number",
                    min_value=1,
                    value=next_season,
                    key="new_season_number"
                )
                
                if st.button("Copy Selected Teams to New Season", type="primary"):
                    if new_season in all_seasons:
                        st.error(f"Season {new_season} already exists. Please choose a different season number.")
                    else:
                        teams_copied = 0
                        failed_teams = []
                        
                        for team in selected_teams:
                            try:
                                # Create new team with reset record
                                new_team_data = {
                                    "name": team["name"],
                                    "season": new_season,
                                    "league": team["league"],
                                    "wins": 0,
                                    "losses": 0,
                                    "ties": 0,
                                    "is_active": 1
                                }
                                
                                response = requests.post(
                                    f"{API_BASE_URL}/teams",
                                    json=new_team_data
                                )
                                
                                if response.status_code == 200:
                                    teams_copied += 1
                                else:
                                    failed_teams.append(team["name"])
                            except Exception as e:
                                failed_teams.append(team["name"])
                                st.error(f"Error copying team {team['name']}: {str(e)}")
                        
                        if teams_copied > 0:
                            st.success(f"Successfully copied {teams_copied} teams to Season {new_season}!")
                            if failed_teams:
                                st.warning(f"Failed to copy some teams: {', '.join(failed_teams)}")
                            st.info("""
                            Teams have been created with reset records.
                            You can now:
                            1. Update team details if needed
                            2. Add new teams
                            3. Add players to the teams
                            """)
                            # Clear caches to refresh data
                            fetch_teams_force()
                        else:
                            st.error("Failed to copy teams to new season.")
                            if failed_teams:
                                st.error(f"Failed teams: {', '.join(failed_teams)}")
    else:
        st.info("No teams available. You can create teams for your first season in the Team Management section.")

def stats_tab():
    st.header("Stats")
    # Add a refresh button
    if st.button("🔄 Refresh", key="refresh_stats"):
        # Remove all session state keys related to stats
        for key in list(st.session_state.keys()):
            if key.startswith('stats_game_') or key.startswith('stats_season_'):
                del st.session_state[key]
        st.rerun()

    # Get all seasons from games
    games = fetch_games()
    if not games:
        st.info("No games available.")
        return
        
    seasons = sorted(list(set(g["season"] for g in games)), reverse=True)
    selected_season = st.selectbox("Select Season", options=seasons, key="stats_season_select")
    
    view = st.radio("Select View", ["Per Game", "Leaderboard (Reg. Season)", "Leaderboard (Playoffs)"], horizontal=True)
    
    if view == "Per Game":
        # Filter games for selected season
        season_games = [g for g in games if g["season"] == selected_season]
        if not season_games:
            st.info(f"No games available for Season {selected_season}.")
            return
            
        # Group games by week for better organization
        games_by_week = {}
        for game in season_games:
            week = game["week"]
            if week not in games_by_week:
                games_by_week[week] = []
            games_by_week[week].append(game)
        
        # Create a formatted game option for each game
        game_options = {}
        for week in sorted(games_by_week.keys()):
            for game in sorted(games_by_week[week], key=lambda x: x["league"]):
                display_text = f"Week {game['week']} - {game['league']}: {game['team1_name']} vs {game['team2_name']}"
                game_options[display_text] = game['id']
        
        if not game_options:
            st.info(f"No games found for Season {selected_season}")
            return
            
        selected_game = st.selectbox("Select Game", options=list(game_options.keys()), key="stats_per_game_select")
        selected_game_id = game_options[selected_game]
        
        stats_key = f"stats_game_{selected_game_id}"
        if stats_key in st.session_state:
            stats = st.session_state[stats_key]
        else:
            response = requests.get(f"{API_BASE_URL}/stats/batch/?game_id={selected_game_id}")
            if response.status_code == 200:
                stats = response.json()
                st.session_state[stats_key] = stats
            else:
                st.error("Failed to fetch stats.")
                stats = []
                
        if stats:
            df = pd.DataFrame(stats)
            # Passing Box Score
            st.subheader("Passing")
            qb_cols = ['player_name', 'passes_completed', 'passes_attempted', 'passing_tds', 'interceptions_thrown', 'qb_rushing_tds']
            qb_df = df[qb_cols].copy()
            qb_df = qb_df[(qb_df[qb_cols[1:]] != 0).any(axis=1)]
            qb_df['C/ATT'] = qb_df['passes_completed'].astype(str) + '/' + qb_df['passes_attempted'].astype(str)
            qb_df['Comp %'] = (qb_df['passes_completed'] / qb_df['passes_attempted'].replace(0, pd.NA) * 100).round(1).fillna(0)
            qb_df = qb_df.rename(columns={
                'player_name': 'Player',
                'passing_tds': 'Pass TD',
                'interceptions_thrown': 'INT',
                'passes_completed': 'Comp',
                'passes_attempted': 'Att',
                'qb_rushing_tds': 'Rush TD'
            })
            qb_df = qb_df[['Player', 'C/ATT', 'Comp %', 'Pass TD', 'Rush TD', 'INT']]
            st.dataframe(qb_df, hide_index=True)
            
            # Rushing Box Score
            st.subheader("Rushing")
            rush_cols = ['player_name', 'rush_attempts', 'rushing_tds', 'first_downs']
            rush_df = df[rush_cols].copy()
            rush_df = rush_df[(rush_df[rush_cols[1:]] != 0).any(axis=1)]
            rush_df = rush_df.rename(columns={
                'player_name': 'Player',
                'rush_attempts': 'Att',
                'rushing_tds': 'TD',
                'first_downs': '1st'
            })
            rush_df = rush_df[rush_df['Att'] > 0]
            st.dataframe(rush_df, hide_index=True)
            
            # Receiving Box Score
            st.subheader("Receiving")
            rec_cols = ['player_name', 'receptions', 'targets', 'receiving_tds', 'drops', 'first_downs']
            rec_df = df[rec_cols].copy()
            rec_df = rec_df[(rec_df[rec_cols[1:]] != 0).any(axis=1)]
            rec_df = rec_df.rename(columns={
                'player_name': 'Player',
                'receptions': 'Rec',
                'targets': 'Tgt',
                'receiving_tds': 'TD',
                'drops': 'Drops',
                'first_downs': '1st'
            })
            rec_df = rec_df.sort_values(by='Tgt', ascending=False)
            st.dataframe(rec_df, hide_index=True)
            
            # Defense Box Score
            st.subheader("Defense")
            def_cols = ['player_name', 'interceptions', 'sacks', 'def_td', 'flag_pulls', 'pass_breakups']
            def_df = df[def_cols].copy()
            def_df = def_df[(def_df[def_cols[1:]] != 0).any(axis=1)]
            def_df = def_df.rename(columns={
                'player_name': 'Player',
                'interceptions': 'INT',
                'sacks': 'Sacks',
                'def_td': 'TD',
                'flag_pulls': 'FP',
                'pass_breakups': 'PB'
            })
            def_df = def_df.sort_values(by='FP', ascending=False)
            st.dataframe(def_df, hide_index=True)
        else:
            st.info("No stats for this game.")
            
    elif view == "Leaderboard (Reg. Season)":
        stats_key = f"stats_season_{selected_season}_regular"
        if stats_key in st.session_state:
            stats = st.session_state[stats_key]
        else:
            response = requests.get(f"{API_BASE_URL}/stats/batch/?season={selected_season}")
            if response.status_code == 200:
                all_stats = response.json()
                # Exclude playoff weeks (6, 7)
                regular_game_ids = [g['id'] for g in games if g['season'] == selected_season and g['week'] not in [6, 7]]
                stats = [s for s in all_stats if s.get('game_id') in regular_game_ids]
                st.session_state[stats_key] = stats
            else:
                st.error("Failed to fetch stats.")
                stats = []
                
        if stats:
            df = pd.DataFrame(stats)
            # Passing Leaderboard
            st.subheader("Passing Leaderboard")
            qb_cols = ['player_name', 'passes_completed', 'passes_attempted', 'passing_tds', 'interceptions_thrown', 'qb_rushing_tds']
            qb_leader = df.groupby('player_name')[qb_cols[1:]].sum().reset_index()
            qb_leader = qb_leader[(qb_leader[qb_cols[1:]] != 0).any(axis=1)]
            qb_leader['C/ATT'] = qb_leader['passes_completed'].astype(str) + '/' + qb_leader['passes_attempted'].astype(str)
            qb_leader['Comp %'] = (qb_leader['passes_completed'] / qb_leader['passes_attempted'].replace(0, pd.NA) * 100).round(1).fillna(0)
            qb_leader = qb_leader.rename(columns={
                'player_name': 'Player',
                'passing_tds': 'Pass TD',
                'interceptions_thrown': 'INT',
                'passes_completed': 'Comp',
                'passes_attempted': 'Att',
                'qb_rushing_tds': 'Rush TD'
            })
            qb_leader = qb_leader[['Player', 'C/ATT', 'Comp %', 'Pass TD', 'Rush TD', 'INT']]
            qb_leader = qb_leader.sort_values(by=['Pass TD', 'Rush TD'], ascending=False)
            st.dataframe(qb_leader, hide_index=True)
            
            # Rushing Leaderboard
            st.subheader("Rushing Leaderboard")
            rush_cols = ['player_name', 'rush_attempts', 'rushing_tds', 'first_downs']
            rush_leader = df.groupby('player_name')[rush_cols[1:]].sum().reset_index()
            rush_leader = rush_leader[(rush_leader[rush_cols[1:]] != 0).any(axis=1)]
            rush_leader = rush_leader.rename(columns={
                'player_name': 'Player',
                'rush_attempts': 'Att',
                'rushing_tds': 'TD',
                'first_downs': '1st'
            })
            rush_leader = rush_leader[rush_leader['Att'] > 0]
            rush_leader = rush_leader.sort_values(by='TD', ascending=False)
            st.dataframe(rush_leader, hide_index=True)
            
            # Receiving Leaderboard
            st.subheader("Receiving Leaderboard")
            rec_cols = ['player_name', 'receptions', 'targets', 'receiving_tds', 'drops', 'first_downs']
            rec_leader = df.groupby('player_name')[rec_cols[1:]].sum().reset_index()
            rec_leader = rec_leader[(rec_leader[rec_cols[1:]] != 0).any(axis=1)]
            rec_leader = rec_leader.rename(columns={
                'player_name': 'Player',
                'receptions': 'Rec',
                'targets': 'Tgt',
                'receiving_tds': 'TD',
                'drops': 'Drops',
                'first_downs': '1st'
            })
            rec_leader = rec_leader.sort_values(by='Rec', ascending=False)
            st.dataframe(rec_leader, hide_index=True)
            
            # Defense Leaderboard
            st.subheader("Defense Leaderboard")
            def_cols = ['player_name', 'interceptions', 'sacks', 'def_td', 'flag_pulls', 'pass_breakups']
            def_leader = df.groupby('player_name')[def_cols[1:]].sum().reset_index()
            def_leader = def_leader[(def_leader[def_cols[1:]] != 0).any(axis=1)]
            def_leader = def_leader.rename(columns={
                'player_name': 'Player',
                'interceptions': 'INT',
                'sacks': 'Sacks',
                'def_td': 'TD',
                'flag_pulls': 'FP',
                'pass_breakups': 'PB'
            })
            def_leader = def_leader.sort_values(by='FP', ascending=False)
            st.dataframe(def_leader, hide_index=True)
        else:
            st.info(f"No regular season stats available for Season {selected_season}.")
            
    elif view == "Leaderboard (Playoffs)":
        stats_key = f"stats_season_{selected_season}_playoffs"
        if stats_key in st.session_state:
            stats = st.session_state[stats_key]
        else:
            response = requests.get(f"{API_BASE_URL}/stats/batch/?season={selected_season}")
            if response.status_code == 200:
                all_stats = response.json()
                playoff_game_ids = [g['id'] for g in games if g['season'] == selected_season and g['week'] in [6, 7]]
                stats = [s for s in all_stats if s.get('game_id') in playoff_game_ids]
                st.session_state[stats_key] = stats
            else:
                st.error("Failed to fetch stats.")
                stats = []
                
        if stats:
            df = pd.DataFrame(stats)
            st.header(f"Playoffs Leaderboard")
            # Passing Leaderboard
            st.subheader("Passing Leaderboard")
            qb_cols = ['player_name', 'passes_completed', 'passes_attempted', 'passing_tds', 'interceptions_thrown', 'qb_rushing_tds']
            qb_leader = df.groupby('player_name')[qb_cols[1:]].sum().reset_index()
            qb_leader = qb_leader[(qb_leader[qb_cols[1:]] != 0).any(axis=1)]
            qb_leader['C/ATT'] = qb_leader['passes_completed'].astype(str) + '/' + qb_leader['passes_attempted'].astype(str)
            qb_leader['Comp %'] = (qb_leader['passes_completed'] / qb_leader['passes_attempted'].replace(0, pd.NA) * 100).round(1).fillna(0)
            qb_leader = qb_leader.rename(columns={
                'player_name': 'Player',
                'passing_tds': 'Pass TD',
                'interceptions_thrown': 'INT',
                'passes_completed': 'Comp',
                'passes_attempted': 'Att',
                'qb_rushing_tds': 'Rush TD'
            })
            qb_leader = qb_leader[['Player', 'C/ATT', 'Comp %', 'Pass TD', 'Rush TD', 'INT']]
            qb_leader = qb_leader.sort_values(by=['Pass TD', 'Rush TD'], ascending=False)
            st.dataframe(qb_leader, hide_index=True)

def main():
    st.title("Flag Football Stats App")
    
    # Create tabs for different sections
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "Standings",
        "Stats",
        "Stat Entry",
        "Team & Player Management",
        "Game Management",
        "Season Management"
    ])
    
    with tab1:
        standings_management()
    
    with tab2:
        stats_tab()
        
    with tab3:
        stat_entry()
    
    with tab4:
        team_player_management()
    
    with tab5:
        game_management()
        
    with tab6:
        season_management()

if __name__ == "__main__":
    main() 