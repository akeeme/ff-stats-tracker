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

def fetch_teams():
    """Fetch all teams from the API"""
    try:
        response = requests.get(f"{API_BASE_URL}/teams")
        if response.status_code == 200:
            st.session_state.teams = response.json()
            return st.session_state.teams
        else:
            st.error("Failed to fetch teams")
            return []
    except requests.RequestException as e:
        st.error(f"Error connecting to API: {str(e)}")
        return []

def fetch_players():
    """Fetch all players from the API"""
    try:
        response = requests.get(f"{API_BASE_URL}/players")
        if response.status_code == 200:
            st.session_state.players = response.json()
            return st.session_state.players
        else:
            st.error("Failed to fetch players")
            return []
    except requests.RequestException as e:
        st.error(f"Error connecting to API: {str(e)}")
        return []

def fetch_games():
    """Fetch all games from the API"""
    try:
        response = requests.get(f"{API_BASE_URL}/games")
        if response.status_code == 200:
            st.session_state.games = response.json()
            return st.session_state.games
        else:
            st.error("Failed to fetch games")
            return []
    except requests.RequestException as e:
        st.error(f"Error connecting to API: {str(e)}")
        return []

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
    
    # Create Game
    st.subheader("Create Game")
    teams = fetch_teams()
    if len(teams) >= 2:
        team_options = {team["name"]: team["id"] for team in teams}
        week = st.number_input("Week", min_value=1, value=1)
        league = st.text_input("League")
        season = st.number_input("Season", min_value=1, value=1)
        team1 = st.selectbox("Team 1", options=list(team_options.keys()), key="team1")
        team1_score = st.number_input("Team 1 Score", min_value=0, value=0, key="team1_score")
        team2 = st.selectbox("Team 2", options=list(team_options.keys()), key="team2")
        team2_score = st.number_input("Team 2 Score", min_value=0, value=0, key="team2_score")
        
        # Determine winning team based on scores
        winning_team = None
        if team1_score > team2_score:
            winning_team = team1
        elif team2_score > team1_score:
            winning_team = team2
        
        if st.button("Create Game"):
            if team1 != team2:
                try:
                    response = requests.post(
                        f"{API_BASE_URL}/games",
                        json={
                            "week": week,
                            "league": league,
                            "season": season,
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
                st.warning("Team 1 and Team 2 must be different teams")
    else:
        st.warning("Please create at least two teams first")

    # View Past Games
    st.subheader("Past Games")
    games = fetch_games()
    if games:
        for game in games:
            st.write(
                f"Week {game['week']} - {game['league']} Season {game['season']}: "
                f"{game['team1_name']} ({game['team1_score']}) vs "
                f"{game['team2_name']} ({game['team2_score']})"
                f"{' - Winner: ' + game['winning_team_name'] if game['winning_team_name'] else ''}"
            )
    else:
        st.info("No games available")

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
        # Convert game data for selectbox
        game_options = {
            f"Week {game['week']} - {game['league']} Season {game['season']}: {game['team1_name']} vs {game['team2_name']}": game['id']
            for game in games
        }
        selected_game = st.selectbox("Select Game", options=list(game_options.keys()))
        
        players = fetch_players()
        if players:
            # Create tabs for different stat categories
            qb_tab, rec_tab, rush_tab, def_tab = st.tabs(["QB Stats", "Receiver Stats", "Rushing Stats", "Defense Stats"])
            
            with qb_tab:
                st.subheader("QB Stats Entry")
                
                # Add QB button
                col1, col2 = st.columns([1, 10])
                with col1:
                    if st.button("➕", key="add_qb"):
                        new_index = max(st.session_state.qb_forms) + 1 if st.session_state.qb_forms else 0
                        st.session_state.qb_forms.append(new_index)
                
                # Create forms for each QB
                for i in st.session_state.qb_forms:
                    with st.container():
                        # Header with remove button
                        col1, col2 = st.columns([6, 1])
                        with col1:
                            st.markdown(f"**QB #{i+1}**")
                        with col2:
                            if st.button("🗑️", key=f"remove_qb_{i}"):
                                st.session_state.qb_forms.remove(i)
                                st.rerun()
                        
                        # Player selection
                        qb_player = st.selectbox(
                            "Select QB",
                            options=[player["name"] for player in players],
                            key=f"qb_player_{i}"
                        )
                        
                        # Stats input
                        cols = st.columns(5)
                        
                        # Pass Yards
                        with cols[0]:
                            st.markdown("**Pass Yards**")
                            if st.button("-", key=f"qb_yards_minus_{i}"):
                                current = st.session_state.get(f"qb_pass_yards_{i}", 0)
                                if current > 0:
                                    st.session_state[f"qb_pass_yards_{i}"] = current - 1
                            st.number_input("", min_value=0, key=f"qb_pass_yards_{i}", label_visibility="collapsed")
                            if st.button("+", key=f"qb_yards_plus_{i}"):
                                current = st.session_state.get(f"qb_pass_yards_{i}", 0)
                                st.session_state[f"qb_pass_yards_{i}"] = current + 1
                        
                        # Pass TDs
                        with cols[1]:
                            st.markdown("**Pass TDs**")
                            if st.button("-", key=f"qb_tds_minus_{i}"):
                                current = st.session_state.get(f"qb_pass_tds_{i}", 0)
                                if current > 0:
                                    st.session_state[f"qb_pass_tds_{i}"] = current - 1
                            st.number_input("", min_value=0, key=f"qb_pass_tds_{i}", label_visibility="collapsed")
                            if st.button("+", key=f"qb_tds_plus_{i}"):
                                current = st.session_state.get(f"qb_pass_tds_{i}", 0)
                                st.session_state[f"qb_pass_tds_{i}"] = current + 1
                        
                        # Completions
                        with cols[2]:
                            st.markdown("**Completions**")
                            if st.button("-", key=f"qb_comp_minus_{i}"):
                                current = st.session_state.get(f"qb_completions_{i}", 0)
                                if current > 0:
                                    st.session_state[f"qb_completions_{i}"] = current - 1
                            st.number_input("", min_value=0, key=f"qb_completions_{i}", label_visibility="collapsed")
                            if st.button("+", key=f"qb_comp_plus_{i}"):
                                current = st.session_state.get(f"qb_completions_{i}", 0)
                                st.session_state[f"qb_completions_{i}"] = current + 1
                        
                        # Attempts
                        with cols[3]:
                            st.markdown("**Attempts**")
                            if st.button("-", key=f"qb_att_minus_{i}"):
                                current = st.session_state.get(f"qb_attempts_{i}", 0)
                                if current > 0:
                                    st.session_state[f"qb_attempts_{i}"] = current - 1
                            st.number_input("", min_value=0, key=f"qb_attempts_{i}", label_visibility="collapsed")
                            if st.button("+", key=f"qb_att_plus_{i}"):
                                current = st.session_state.get(f"qb_attempts_{i}", 0)
                                st.session_state[f"qb_attempts_{i}"] = current + 1
                        
                        # INTs
                        with cols[4]:
                            st.markdown("**INTs**")
                            if st.button("-", key=f"qb_int_minus_{i}"):
                                current = st.session_state.get(f"qb_ints_{i}", 0)
                                if current > 0:
                                    st.session_state[f"qb_ints_{i}"] = current - 1
                            st.number_input("", min_value=0, key=f"qb_ints_{i}", label_visibility="collapsed")
                            if st.button("+", key=f"qb_int_plus_{i}"):
                                current = st.session_state.get(f"qb_ints_{i}", 0)
                                st.session_state[f"qb_ints_{i}"] = current + 1
                        
                        if st.button("Log QB Stats", key=f"log_qb_{i}", use_container_width=True):
                            qb_id = next((p["id"] for p in players if p["name"] == qb_player), None)
                            if qb_id:
                                try:
                                    response = requests.post(
                                        f"{API_BASE_URL}/stats",
                                        json={
                                            "player_id": qb_id,
                                            "game_id": game_options[selected_game],
                                            "passing_yards": st.session_state.get(f"qb_pass_yards_{i}", 0),
                                            "passing_tds": st.session_state.get(f"qb_pass_tds_{i}", 0),
                                            "passes_completed": st.session_state.get(f"qb_completions_{i}", 0),
                                            "passes_attempted": st.session_state.get(f"qb_attempts_{i}", 0),
                                            "interceptions_thrown": st.session_state.get(f"qb_ints_{i}", 0),
                                            "receptions": 0, "targets": 0, "receiving_yards": 0,
                                            "receiving_tds": 0, "drops": 0, "first_downs": 0,
                                            "rushing_yards": 0, "rushing_tds": 0, "rush_attempts": 0,
                                            "flag_pulls": 0, "interceptions": 0, "pass_breakups": 0, "def_td": 0
                                        }
                                    )
                                    if response.status_code == 200:
                                        st.success(f"QB Stats logged for {qb_player}!")
                                    else:
                                        st.error("Failed to log QB stats")
                                except requests.RequestException as e:
                                    st.error(f"Error connecting to API: {str(e)}")
                        st.markdown("---")

            # Similar pattern for other tabs...
            # (I'll show just the QB tab for now to ensure it works, then we can add the others)

        else:
            st.warning("No players available")
    else:
        st.warning("No games available")

def standings_management():
    """Handle team standings display"""
    st.header("Standings")
    
    teams = fetch_teams()
    if teams:
        # Add custom CSS to make tables larger and more readable
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
    
    teams = fetch_teams()
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
                        response = requests.post(
                            f"{API_BASE_URL}/teams/end-season/{selected_season}"
                        )
                        if response.status_code == 200:
                            result = response.json()
                            st.success(f"Successfully ended Season {selected_season}. {result['teams_updated']} teams marked as inactive.")
                            st.info("You can now create new teams for the next season.")
                            fetch_teams()  # Refresh teams list
                        else:
                            st.error(f"Failed to end season: {response.text}")
                    except requests.RequestException as e:
                        st.error(f"Error connecting to API: {str(e)}")
            else:
                st.info("No active seasons found.")
        
        # Start New Season Section
        with st.expander("Start New Season", expanded=True):
            st.write("### Start New Season")
            st.write("""
            This will help you set up a new season by copying teams from a previous season.
            The teams will be created with:
            - Same name and league
            - Reset records (0 wins, 0 losses, 0 ties)
            - Active status
            """)
            
            # Select source season
            source_season = st.selectbox(
                "Copy Teams From Season",
                options=all_seasons,
                key="copy_from_season"
            )
            
            # Calculate next season number
            next_season = max(all_seasons) + 1 if all_seasons else 1
            
            # Input for new season
            new_season = st.number_input(
                "New Season Number",
                min_value=1,
                value=next_season,
                key="new_season_number"
            )
            
            if st.button("Copy Teams to New Season", type="primary"):
                if new_season in all_seasons:
                    st.error(f"Season {new_season} already exists. Please choose a different season number.")
                else:
                    try:
                        response = requests.post(
                            f"{API_BASE_URL}/teams/copy-to-season",
                            params={"from_season": source_season, "to_season": new_season}
                        )
                        if response.status_code == 200:
                            result = response.json()
                            st.success(f"Successfully copied {result['teams_copied']} teams to Season {new_season}!")
                            st.info("""
                            Teams have been created with reset records.
                            You can now:
                            1. Update team details if needed
                            2. Add new teams
                            3. Add players to the teams
                            """)
                            fetch_teams()  # Refresh teams list
                        else:
                            st.error(f"Failed to copy teams: {response.text}")
                    except requests.RequestException as e:
                        st.error(f"Error connecting to API: {str(e)}")
    else:
        st.info("No teams available. You can create teams for your first season in the Team Management section.")

def main():
    st.title("Flag Football Stats App")
    
    # Create tabs for different sections
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "Team & Player Management",
        "Game Management",
        "Stat Entry",
        "Standings",
        "Season Management"
    ])
    
    with tab1:
        team_player_management()
    
    with tab2:
        game_management()
    
    with tab3:
        stat_entry()
        
    with tab4:
        standings_management()
        
    with tab5:
        season_management()

if __name__ == "__main__":
    main() 