const { createClient } = require('./node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://gmfnoxhpucymoofkdlyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZm5veGhwdWN5bW9vZmtkbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MTI3NDIsImV4cCI6MjA5MzE4ODc0Mn0.NZ9jEywlH3dB6EoziohWcysPZkxXSeaBw6yCRfdC9hw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecent() {
  console.log('Querying recent coach reports...');
  const { data: coachData, error: coachError } = await supabase
    .from('coach_reports')
    .select('created_at, team_name, opponent, youtube_url')
    .order('created_at', { ascending: false })
    .limit(5);

  if (coachError) {
    console.error('Error fetching coach reports:', coachError);
  } else {
    console.log('Recent Coach Reports:', JSON.stringify(coachData, null, 2));
  }

  console.log('Querying recent game sessions...');
  const { data: gameData, error: gameError } = await supabase
    .from('game_sessions')
    .select('created_at, player_name, team_name, youtube_url')
    .order('created_at', { ascending: false })
    .limit(5);

  if (gameError) {
    console.error('Error fetching game sessions:', gameError);
  } else {
    console.log('Recent Game Sessions:', JSON.stringify(gameData, null, 2));
  }
}

checkRecent();
