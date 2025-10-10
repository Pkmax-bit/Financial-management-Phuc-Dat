import React, { useState, useEffect } from 'react';
import {
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Avatar,
  Box,
  Chip,
  CardActions,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Group as GroupIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { ProjectTeamDrawer } from './ProjectTeamDrawer';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  start_date: string;
  hourly_rate?: number;
  skills?: string[];
  avatar?: string;
  user_id?: string;
  status: string;
}

interface ProjectTeamTabProps {
  projectId: string;
}

export const ProjectTeamTab: React.FC<ProjectTeamTabProps> = ({ projectId }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchTeamMembers();
  }, [projectId]);

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get(`/api/project-team/${projectId}`);
      setTeamMembers(response.data);
    } catch (error) {
      enqueueSnackbar('Lỗi khi tải danh sách thành viên', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/project-team/${id}`);
      enqueueSnackbar('Đã xóa thành viên khỏi dự án', { variant: 'success' });
      fetchTeamMembers();
    } catch (error) {
      enqueueSnackbar('Lỗi khi xóa thành viên', { variant: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <GroupIcon sx={{ mr: 1 }} />
          Thành viên dự án
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setDrawerOpen(true)}
          sx={{ px: 3 }}
        >
          Thêm thành viên
        </Button>
      </Box>

      <Grid container spacing={3}>
        {teamMembers.map((member) => (
          <Grid item xs={12} sm={6} md={3} key={member.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardContent sx={{ flex: 1, p: 3 }}>
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  textAlign="center"
                  mb={2}
                >
                  <Avatar
                    src={member.avatar}
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mb: 2,
                      boxShadow: 2,
                      bgcolor: 'primary.main'
                    }}
                  >
                    {member.name.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" gutterBottom noWrap>
                    {member.name}
                  </Typography>
                  <Chip
                    label={member.role}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                </Box>

                {member.email && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    align="center"
                    noWrap 
                    gutterBottom
                  >
                    {member.email}
                  </Typography>
                )}

                <Box mt={2} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Bắt đầu: {new Date(member.start_date).toLocaleDateString('vi-VN')}
                  </Typography>
                  <Box mt={1}>
                    <Chip
                      size="small"
                      label={member.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                      color={getStatusColor(member.status)}
                    />
                  </Box>
                </Box>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(member.id)}
                  color="error"
                  sx={{ 
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'white'
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'background.default',
              border: '2px dashed',
              borderColor: 'divider',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <AddIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">
                Thêm thành viên mới
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ProjectTeamDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        projectId={projectId}
        onSuccess={fetchTeamMembers}
      />
    </div>
  );
};