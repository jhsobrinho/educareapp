
import { useState, useEffect } from 'react';
import { LicenseTeam, LicenseAllocationParams } from '@/types/license';
import { uuid } from '@/utils/uuid';
import { toast } from '@/hooks/use-toast';

export function useTeamManagement() {
  const [teams, setTeams] = useState<LicenseTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Load teams on mount
    loadTeams();
  }, []);
  
  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const storedTeams = localStorage.getItem('smartPeiTeams');
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams));
      } else {
        // Initialize with empty array if no teams found
        setTeams([]);
        localStorage.setItem('smartPeiTeams', JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: "Erro ao carregar equipes",
        description: "Não foi possível carregar as equipes. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveTeams = async (updatedTeams: LicenseTeam[]) => {
    try {
      localStorage.setItem('smartPeiTeams', JSON.stringify(updatedTeams));
      setTeams(updatedTeams);
    } catch (error) {
      console.error('Error saving teams:', error);
      throw error;
    }
  };
  
  const getAllTeams = () => {
    return teams;
  };
  
  const getTeamById = (teamId: string) => {
    return teams.find(team => team.id === teamId);
  };
  
  const getTeamsByLicense = (licenseId: string) => {
    return teams.filter(team => team.licenseId === licenseId || (team.licenses && team.licenses.includes(licenseId)));
  };
  
  const getTeamsByStudentId = (studentId: string) => {
    return teams.filter(team => team.studentId === studentId);
  };
  
  const getTeamsByUserId = (userId: string) => {
    return teams.filter(team => 
      team.members.some(member => member.id === userId)
    );
  };
  
  const createTeam = (params: LicenseAllocationParams) => {
    const now = new Date().toISOString();
    const teamId = uuid();
    
    const newTeam: LicenseTeam = {
      id: teamId,
      name: params.teamName || `Team ${teams.length + 1}`,
      description: `Team for ${params.studentName || 'student'}`,
      members: params.professionals || [],
      licenses: [params.licenseId],
      licenseId: params.licenseId,
      studentId: params.studentId,
      studentName: params.studentName,
      createdAt: now,
      updatedAt: now
    };
    
    const updatedTeams = [...teams, newTeam];
    saveTeams(updatedTeams);
    
    toast({
      title: "Equipe criada",
      description: `Equipe ${newTeam.name} foi criada com sucesso.`,
    });
    
    return teamId;
  };
  
  const updateTeam = (team: LicenseTeam) => {
    const updatedTeams = teams.map(t => 
      t.id === team.id ? { ...team, updatedAt: new Date().toISOString() } : t
    );
    
    saveTeams(updatedTeams);
    
    toast({
      title: "Equipe atualizada",
      description: `Equipe ${team.name} foi atualizada com sucesso.`,
    });
  };
  
  const deleteTeam = (teamId: string) => {
    const teamToDelete = teams.find(team => team.id === teamId);
    const updatedTeams = teams.filter(team => team.id !== teamId);
    
    saveTeams(updatedTeams);
    
    toast({
      title: "Equipe excluída",
      description: teamToDelete 
        ? `Equipe ${teamToDelete.name} foi excluída com sucesso.` 
        : "Equipe excluída com sucesso.",
    });
  };
  
  return {
    teams,
    isLoading,
    getAllTeams,
    getTeamsByStudentId,
    getTeamsByUserId,
    getTeamsByLicense,
    createTeam,
    updateTeam,
    deleteTeam,
    refreshTeams: loadTeams
  };
}

export default useTeamManagement;
