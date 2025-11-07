import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Paper,
} from '@mui/material';
import ProjectExpensesTab from '../components/expenses/ProjectExpensesTab';
import { ProjectTeamTab } from '../components/projects/ProjectTeamTab';
import { getApiEndpoint } from '@/lib/apiUrl'

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [value, setValue] = useState(0);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    // Fetch project details
    const fetchProject = async () => {
      try {
        const response = await fetch(getApiEndpoint(`/api/projects/${projectId}`);
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  if (!project) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2, p: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {project.name}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          {project.description}
        </Typography>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="project tabs">
          <Tab label="Overview" />
          <Tab label="Team" />
          <Tab label="Expenses" />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <Typography variant="h6" gutterBottom>
          Project Details
        </Typography>
        {/* Add project overview content here */}
      </TabPanel>

      <TabPanel value={value} index={1}>
        <ProjectTeamTab projectId={projectId} />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <ProjectExpensesTab projectId={projectId} />
      </TabPanel>
    </Box>
  );
};

export default ProjectDetail;
