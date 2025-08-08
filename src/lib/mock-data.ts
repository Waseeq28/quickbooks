// Mock data for teams - easy to dispose of later
export interface MockTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface MockTeam {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  members: MockTeamMember[];
}

export interface UserTeamInfo {
  teamId: string;
  role: string;
  isCurrent: boolean;
}

// Mock teams data
export const mockTeams: MockTeam[] = [
  {
    id: "team-1",
    name: "Acme Corp",
    description: "Main development team",
    memberCount: 4,
    members: [
      {
        id: "member-1",
        name: "You",
        email: "you@acme.com",
        role: "Admin",
      },
      {
        id: "member-2",
        name: "John Smith",
        email: "john@acme.com",
        role: "Developer",
      },
      {
        id: "member-3",
        name: "Sarah Johnson",
        email: "sarah@acme.com",
        role: "Designer",
      },
      {
        id: "member-4",
        name: "Mike Wilson",
        email: "mike@acme.com",
        role: "Developer",
      },
    ],
  },
  {
    id: "team-2",
    name: "StartupXYZ",
    description: "Innovation team",
    memberCount: 3,
    members: [
      {
        id: "member-5",
        name: "You",
        email: "you@startupxyz.com",
        role: "Member",
      },
      {
        id: "member-6",
        name: "Alex Chen",
        email: "alex@startupxyz.com",
        role: "Admin",
      },
      {
        id: "member-7",
        name: "Emma Davis",
        email: "emma@startupxyz.com",
        role: "Member",
      },
    ],
  },
  {
    id: "team-3",
    name: "Freelance Projects",
    description: "Client projects team",
    memberCount: 2,
    members: [
      {
        id: "member-8",
        name: "You",
        email: "you@freelance.com",
        role: "Owner",
      },
      {
        id: "member-9",
        name: "David Brown",
        email: "david@freelance.com",
        role: "Contractor",
      },
    ],
  },
];

// Mock user's team associations
export const mockUserTeams: UserTeamInfo[] = [
  {
    teamId: "team-1",
    role: "Admin",
    isCurrent: true, // This is the current team
  },
  {
    teamId: "team-2",
    role: "Member",
    isCurrent: false,
  },
  {
    teamId: "team-3",
    role: "Owner",
    isCurrent: false,
  },
];

// Helper functions
export const getCurrentTeam = () => {
  const currentTeamInfo = mockUserTeams.find(team => team.isCurrent);
  return currentTeamInfo ? mockTeams.find(team => team.id === currentTeamInfo.teamId) : null;
};

export const getUserTeams = () => {
  return mockUserTeams.map(userTeam => {
    const team = mockTeams.find(t => t.id === userTeam.teamId);
    return {
      ...userTeam,
      team: team!,
    };
  });
};

export const getTeamMembers = (teamId: string) => {
  const team = mockTeams.find(t => t.id === teamId);
  return team?.members || [];
};

// Team switching function
export const switchCurrentTeam = (teamId: string) => {
  // Update all teams to not be current
  mockUserTeams.forEach(team => {
    team.isCurrent = false;
  });
  
  // Set the selected team as current
  const targetTeam = mockUserTeams.find(team => team.teamId === teamId);
  if (targetTeam) {
    targetTeam.isCurrent = true;
  }
  
  // Trigger a custom event to notify components
  window.dispatchEvent(new CustomEvent('teamSwitched', { detail: { teamId } }));
};

// Get current team name for display
export const getCurrentTeamName = () => {
  const currentTeam = getCurrentTeam();
  return currentTeam?.name || "No Team Selected";
};
