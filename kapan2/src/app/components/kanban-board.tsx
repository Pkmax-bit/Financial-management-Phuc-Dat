import { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, MoreVertical } from 'lucide-react';
import { Status } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface KanbanBoardProps {
  statuses: Status[];
  items: any[];
  renderCard: (item: any, status: Status) => React.ReactNode;
  onStatusChange: (itemId: string, newStatusId: string) => void;
}

interface ColumnProps {
  status: Status;
  items: any[];
  renderCard: (item: any, status: Status) => React.ReactNode;
  onDrop: (itemId: string, statusId: string) => void;
}

interface DraggableCardProps {
  item: any;
  status: Status;
  renderCard: (item: any, status: Status) => React.ReactNode;
}

const ItemTypes = {
  CARD: 'card',
};

function DraggableCard({ item, status, renderCard }: DraggableCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: { id: item.id, statusId: item.statusId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <motion.div
      ref={drag}
      initial={{ opacity: 1, scale: 1, rotate: 0 }}
      animate={{
        opacity: isDragging ? 0.6 : 1,
        scale: isDragging ? 1.05 : 1,
        rotate: isDragging ? 2 : 0,
      }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      whileHover={{ scale: 1.02 }}
    >
      {renderCard(item, status)}
    </motion.div>
  );
}

function Column({ status, items, renderCard, onDrop }: ColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop: (draggedItem: { id: string; statusId: string }) => {
      if (draggedItem.statusId !== status.id) {
        onDrop(draggedItem.id, status.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <motion.div
      ref={drop}
      className={`
        flex-shrink-0 bg-white border border-[#E1E3E5] rounded transition-all duration-300
        ${isOver ? 'border-[#2066B0] border-2 shadow-lg' : ''}
      `}
      style={{
        width: '280px',
        marginRight: '12px',
        borderRadius: '4px',
      }}
      animate={{
        scale: isOver ? 1.02 : 1,
        boxShadow: isOver
          ? '0 10px 30px rgba(32, 102, 176, 0.2)'
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Column Header - Bitrix24 Tab Style with Arrow */}
      <div className="bg-[#F5F7F8] px-4 py-3 border-b border-[#E1E3E5] relative" style={{ padding: '12px 16px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Bitrix24-style tab with arrow pointing right */}
            <div className="relative inline-block">
              <div
                className="relative px-4 py-1.5 text-[13px] font-semibold text-white"
                style={{
                  backgroundColor: status.color,
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)',
                  minWidth: '100px',
                  fontSize: '13px',
                  fontWeight: 600,
                  lineHeight: '1.2',
                }}
              >
                {status.name}
              </div>
            </div>
            <motion.span
              className="text-xs bg-white text-[#9CA3AF] px-2 py-0.5 rounded font-semibold"
              key={items.length}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: '12px',
                marginLeft: '8px',
              }}
            >
              {items.length}
            </motion.span>
          </div>
          <button 
            className="text-[#9CA3AF] hover:text-[#535C69] transition-colors"
            aria-label="Menu cột"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Column Body */}
      <div 
        className="min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto"
        style={{ padding: '8px' }}
      >
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <DraggableCard
                item={item}
                status={status}
                renderCard={renderCard}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Column Footer */}
      <div className="border-t border-[#F5F7F8]">
        <button 
          className="w-full px-4 py-2 text-[13px] text-[#2066B0] hover:bg-[#E8F4FD] transition-colors flex items-center gap-2"
          style={{ padding: '8px' }}
        >
          <Plus size={16} />
          Thêm
        </button>
      </div>
    </motion.div>
  );
}

export function KanbanBoard({
  statuses,
  items,
  renderCard,
  onStatusChange,
}: KanbanBoardProps) {
  const handleDrop = (itemId: string, newStatusId: string) => {
    onStatusChange(itemId, newStatusId);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className="flex overflow-x-auto pb-4"
        style={{ 
          padding: '16px',
          background: '#F5F7F8',
        }}
      >
        {statuses.map((status) => {
          const columnItems = items.filter((item) => item.statusId === status.id);
          return (
            <Column
              key={status.id}
              status={status}
              items={columnItems}
              renderCard={renderCard}
              onDrop={handleDrop}
            />
          );
        })}
      </div>
    </DndProvider>
  );
}