import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabaseClient';
import { sounds } from '../lib/soundEngine';
import { 
  Users, UserPlus, Check, X, Trash2, Search, 
  Star, MessageSquare, Clock, RefreshCw
} from 'lucide-react';

export default function FriendsHub() {
  const { user, userProfile } = useAppStore();
  
  const [activeTabLocal, setActiveTabLocal] = useState('discover');
  const [requestTab, setRequestTab] = useState('incoming');
  
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  
  const [teamRoster, setTeamRoster] = useState([]);
  const [myTeamId, setMyTeamId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  
  const [friendNotes, setFriendNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('byteforged_friend_notes');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('byteforged_friend_notes', JSON.stringify(friendNotes));
  }, [friendNotes]);

  useEffect(() => {
    if (!user?.id || activeTabLocal === 'discover') return;
    fetchSocialData();
  }, [activeTabLocal]);

  const fetchSocialData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: invites, error: invitesError } = await supabase
        .from('invites')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;

      if (invites && invites.length > 0) {
        const otherIds = [...new Set(invites.map(inv =>
          inv.sender_id === user.id ? inv.recipient_id : inv.sender_id
        ))];

        const { data: liveProfiles } = await supabase
          .from('profiles')
          .select('id, username, avatar')
          .in('id', otherIds);

        const profileMap = Object.fromEntries((liveProfiles || []).map(p => [p.id, p]));

        const enriched = invites.map(inv => ({
          ...inv,
          sender_username: profileMap[inv.sender_id]?.username || inv.sender_username,
          sender_avatar: profileMap[inv.sender_id]?.avatar || inv.sender_avatar,
          recipient_username: profileMap[inv.recipient_id]?.username || inv.recipient_username,
          recipient_avatar: profileMap[inv.recipient_id]?.avatar || inv.recipient_avatar,
        }));

        setIncomingRequests(enriched.filter(inv => inv.recipient_id === user.id));
        setOutgoingRequests(enriched.filter(inv => inv.sender_id === user.id));
      } else {
        setIncomingRequests([]);
        setOutgoingRequests([]);
      }

      const { data: acceptedFriends, error: friendsError } = await supabase
        .from('invites')
        .select('id, sender_id, recipient_id')
        .eq('status', 'accepted')
        .eq('type', 'friend')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (friendsError) throw friendsError;

      if (acceptedFriends && acceptedFriends.length > 0) {
        const friendIds = acceptedFriends.map(inv =>
          inv.sender_id === user.id ? inv.recipient_id : inv.sender_id
        );

        const { data: friendProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar, title, is_online, last_seen')
          .in('id', friendIds);

        if (profilesError) throw profilesError;

        const mapped = (friendProfiles || []).map(fp => {
          const invite = acceptedFriends.find(inv =>
            (inv.sender_id === fp.id && inv.recipient_id === user.id) ||
            (inv.recipient_id === fp.id && inv.sender_id === user.id)
          );
          return { ...fp, inviteId: invite?.id };
        });
        setFriends(mapped);
      } else {
        setFriends([]);
      }
    } catch (err) {
      console.error('Error fetching social data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    if (!user?.id) {
      alert('You must be logged in to search');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar, title, is_online, last_seen')
        .ilike('username', `%${searchQuery.trim()}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      alert('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // STATUS HELPER — Online / Away (Xm) / Offline with 3-tier detection
  // ============================================================================
  const getStatusInfo = (friend) => {
    if (friend.is_online && friend.last_seen) {
      const minutesAgo = Math.floor((Date.now() - new Date(friend.last_seen).getTime()) / 60000);
      if (minutesAgo <= 2) return { label: 'Online', color: 'bg-emerald-500', glow: true };
      if (minutesAgo <= 15) return { label: `Away (${minutesAgo}m)`, color: 'bg-amber-500', glow: false };
      return { label: 'Offline', color: 'bg-slate-600', glow: false };
    }
    return { label: 'Offline', color: 'bg-slate-600', glow: false };
  };

  const handleSendInvite = async (targetUser, type = 'friend') => {
    if (!user?.id) return;
    setActionLoading(prev => ({ ...prev, [`invite-${targetUser.id}`]: true }));
    sounds?.playClick?.();

    try {
      const { error } = await supabase.from('invites').insert({
        id: crypto.randomUUID(),
        sender_id: user.id,
        sender_username: userProfile?.username || user.username || 'Unknown',
        sender_avatar: userProfile?.avatar || '👤',
        recipient_id: targetUser.id,
        recipient_username: targetUser.username,
        type: type,
        origin: 'FriendsHub',
        status: 'pending'
      });

      if (error) throw error;
      sounds?.playUnlock?.();
      alert(`✅ ${type === 'team' ? 'Team' : 'Friend'} invite sent to ${targetUser.username}!`);
      
      fetchSocialData();
    } catch (err) {
      console.error('Failed to send invite:', err);
      alert('❌ Failed to send invite: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`invite-${targetUser.id}`]: false }));
    }
  };

  const handleRequestAction = async (inviteId, action, inviteType, senderId) => {
    setActionLoading(prev => ({ ...prev, [`req-${inviteId}`]: true }));
    sounds?.playClick?.();

    try {
      if (action === 'delete') {
        const { error } = await supabase.from('invites').delete().eq('id', inviteId);
        if (error) throw error;
      } else if (action === 'accepted' && inviteType === 'team') {
        console.log('Calling accept_team_invite_proper with inviteId:', inviteId);
        const { error: rpcError } = await supabase.rpc('accept_team_invite_proper', {
          p_invite_id: inviteId
        });
        
        if (rpcError) {
          console.error('RPC Error:', rpcError);
          throw rpcError;
        }
      } else {
        const { error } = await supabase.from('invites').update({ status: action }).eq('id', inviteId);
        if (error) throw error;
      }
      
      sounds?.playUnlock?.();
      await fetchSocialData();
    } catch (err) {
      console.error('Failed to process request:', err);
      alert('❌ Failed: ' + (err.message || err.error_description || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [`req-${inviteId}`]: false }));
    }
  };

  const handleRemoveFriend = async (friendId, inviteId) => {
    if (!window.confirm('Remove this friend? The friendship will be deleted for BOTH of you.')) return;
    setActionLoading(prev => ({ ...prev, [`remove-${friendId}`]: true }));

    try {
      const { error } = await supabase.from('invites').delete().eq('id', inviteId);
      if (error) throw error;
      
      setFriends(prev => prev.filter(f => f.id !== friendId));
      setFriendNotes(prev => {
        const next = { ...prev };
        delete next[friendId];
        return next;
      });
      sounds?.playClick?.();
    } catch (err) {
      console.error('Failed to remove friend:', err);
      alert('❌ Failed to remove friend: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`remove-${friendId}`]: false }));
    }
  };

  const toggleFavorite = (friendId) => {
    setFriendNotes(prev => {
      const current = prev[friendId] || {};
      return { ...prev, [friendId]: { ...current, isFavorite: !current.isFavorite } };
    });
  };

  const updateFriendNote = (friendId, note) => {
    setFriendNotes(prev => ({ ...prev, [friendId]: { ...(prev[friendId] || {}), note } }));
  };

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const aFav = friendNotes[a.id]?.isFavorite ? 1 : 0;
      const bFav = friendNotes[b.id]?.isFavorite ? 1 : 0;
      return bFav - aFav;
    });
  }, [friends, friendNotes]);

  if (loading && activeTabLocal !== 'discover') {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="ml-3 text-slate-300 font-mono">Syncing network data...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 font-sans space-y-6 text-slate-100 min-h-screen animate-fadeIn relative">
      
      {/* Purple/Pink Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-fuchsia-400/5 rounded-full blur-[100px]" />
      </div>

      {/* Header — Frosted Glass */}
      <div className="bg-slate-900/40 border border-purple-500/20 rounded-3xl p-6 shadow-2xl shadow-purple-500/10 backdrop-blur-2xl relative">
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
        
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-300 shadow-lg shadow-purple-500/20">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-200 tracking-wide">Friends & Network Hub</h1>
        </div>

        <div className="flex space-x-2 bg-slate-950/60 p-1.5 rounded-xl border border-purple-500/20 w-fit backdrop-blur-sm">
          {[
            { id: 'discover', label: 'Discover' },
            { id: 'requests', label: 'Requests' },
            { id: 'friends', label: 'Friends' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabLocal(tab.id)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTabLocal === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'requests' && incomingRequests.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black shadow-sm">
                  {incomingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* DISCOVER TAB */}
      {activeTabLocal === 'discover' && (
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 flex gap-4 backdrop-blur-2xl shadow-lg shadow-purple-500/5">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-purple-400/60 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder-slate-500 backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl text-sm font-black transition disabled:opacity-50 shadow-lg shadow-purple-500/30"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchResults.map(u => {
              const status = getStatusInfo(u);
              return (
                <div key={u.id} className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 flex flex-col items-center text-center space-y-4 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all backdrop-blur-2xl">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 flex items-center justify-center text-3xl shadow-lg">
                      {u.avatar || '👤'}
                    </div>
                    {/* WIRED STATUS BADGE */}
                    <div className="absolute -bottom-1 -right-1 flex items-center gap-1" title={u.last_seen ? `Last seen: ${new Date(u.last_seen).toLocaleString()}` : 'Unknown'}>
                      <div className={`w-5 h-5 rounded-full border-2 border-slate-900 ${status.color} ${status.glow ? 'shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : ''}`} />
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full backdrop-blur-sm border ${
                        status.label === 'Online' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        status.label.startsWith('Away') ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                        'bg-slate-800/80 text-slate-400 border-slate-700'
                      }`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="w-full">
                    <h3 className="text-base font-extrabold text-white">{u.username}</h3>
                    <p className="text-xs text-purple-300 font-bold">{u.title || 'Operative'}</p>
                  </div>
                  <div className="flex space-x-2 w-full pt-2">
                    <button
                      onClick={() => handleSendInvite(u, 'friend')}
                      disabled={actionLoading[`invite-${u.id}`]}
                      className="flex-1 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 rounded-xl py-2 text-xs font-bold transition flex items-center justify-center space-x-1 backdrop-blur-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => handleSendInvite(u, 'team')}
                      disabled={actionLoading[`invite-${u.id}`]}
                      className="flex-1 bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/40 rounded-xl py-2 text-xs font-bold transition flex items-center justify-center space-x-1 backdrop-blur-sm"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Team</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {searchResults.length === 0 && searchQuery && !loading && (
              <div className="col-span-full text-center py-12 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-bold">No operatives found matching "{searchQuery}".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUESTS TAB */}
      {activeTabLocal === 'requests' && (
        <div className="space-y-6">
          <div className="flex space-x-2 bg-slate-950/60 p-1.5 rounded-xl border border-purple-500/20 w-fit backdrop-blur-sm">
            <button
              onClick={() => setRequestTab('incoming')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                requestTab === 'incoming' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              Incoming
            </button>
            <button
              onClick={() => setRequestTab('outgoing')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                requestTab === 'outgoing' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              Outgoing
            </button>
          </div>

          <div className="space-y-3">
            {(requestTab === 'incoming' ? incomingRequests : outgoingRequests).length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 border border-purple-500/20 rounded-2xl text-slate-500 backdrop-blur-2xl">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50 text-purple-400" />
                <p className="font-bold">No {requestTab} requests.</p>
              </div>
            ) : (
              (requestTab === 'incoming' ? incomingRequests : outgoingRequests).map(req => (
                <div key={req.id} className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-2xl hover:border-purple-500/40 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 flex items-center justify-center text-2xl shadow-md">
                      {requestTab === 'incoming' ? (req.sender_avatar || '👤') : (req.recipient_avatar || userProfile?.avatar || '👤')}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        {requestTab === 'incoming' ? req.sender_username : req.recipient_username}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          req.type === 'team' 
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' 
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        }`}>
                          {req.type === 'team' ? 'Team Invite' : 'Friend Request'}
                        </span>
                        {req.origin && (
                          <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <span>from {req.origin}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {requestTab === 'incoming' ? (
                      <>
                        <button
                          onClick={() => handleRequestAction(req.id, 'accepted', req.type, req.sender_id)}
                          disabled={actionLoading[`req-${req.id}`]}
                          className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1 backdrop-blur-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Allow</span>
                        </button>
                        <button
                          onClick={() => handleRequestAction(req.id, 'denied', req.type, req.sender_id)}
                          disabled={actionLoading[`req-${req.id}`]}
                          className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1 backdrop-blur-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Deny</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span>Pending</span>
                      </span>
                    )}
                    <button
                      onClick={() => handleRequestAction(req.id, 'delete', req.type, req.sender_id)}
                      disabled={actionLoading[`req-${req.id}`]}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-xl transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FRIENDS TAB */}
      {activeTabLocal === 'friends' && (
        <div className="space-y-4">
          {sortedFriends.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 border border-purple-500/20 rounded-2xl text-slate-500 backdrop-blur-2xl">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-purple-400" />
              <p className="font-bold">Your friends list is empty.</p>
              <p className="text-sm mt-1">Head to Discover to connect with other operatives!</p>
            </div>
          ) : (
            sortedFriends.map(f => {
              const noteData = friendNotes[f.id] || {};
              const status = getStatusInfo(f);
              return (
                <div key={f.id} className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-2xl hover:border-purple-500/40 transition-all">
                  <div className="flex items-start sm:items-center space-x-4 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
                        {f.avatar || '👤'}
                      </div>
                      {/* WIRED STATUS BADGE */}
                      <div className="absolute -bottom-1 -right-1 flex items-center gap-1" title={f.last_seen ? `Last seen: ${new Date(f.last_seen).toLocaleString()}` : 'Unknown'}>
                        <div className={`w-4 h-4 rounded-full border-2 border-slate-900 ${status.color} ${status.glow ? 'shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse' : ''}`} />
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full backdrop-blur-sm border ${
                          status.label === 'Online' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          status.label.startsWith('Away') ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          'bg-slate-800/80 text-slate-400 border-slate-700'
                        }`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-extrabold text-white truncate">{f.username}</h3>
                        <button
                          onClick={() => toggleFavorite(f.id)}
                          className={`p-1 rounded-full transition ${noteData.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}
                          title="Mark as Favorite"
                        >
                          <Star className={`w-4 h-4 ${noteData.isFavorite ? 'fill-amber-400' : ''}`} />
                        </button>
                      </div>
                      <p className="text-xs text-purple-300 font-bold">{f.title || 'Operative'}</p>
                      
                      <div className="mt-3 flex items-center space-x-2">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400/60 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="Add a private note (only you can see this)..."
                          value={noteData.note || ''}
                          onChange={(e) => updateFriendNote(f.id, e.target.value)}
                          className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 placeholder-slate-500 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:flex-shrink-0">
                    <button
                      onClick={() => handleSendInvite(f, 'team')}
                      disabled={actionLoading[`invite-${f.id}`]}
                      className="px-4 py-2 bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1 backdrop-blur-sm"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Team</span>
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(f.id, f.inviteId)}
                      disabled={actionLoading[`remove-${f.id}`]}
                      className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1 backdrop-blur-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}