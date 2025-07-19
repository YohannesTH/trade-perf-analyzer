# Trading Strategy Backtester

## Overview

This is a full-stack trading strategy backtesting application that allows users to test trading strategies against historical market data. The application features a React frontend with shadcn/ui components and a dual backend architecture supporting both Node.js/TypeScript and Python/FastAPI services.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application uses a modern full-stack architecture with the following key components:

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for performance visualization

### Backend Architecture
- **Dual Backend Approach**: 
  - Node.js/Express server for web serving and API routing
  - Python/FastAPI service for backtesting computations
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Session Management**: PostgreSQL-based session storage

### Build System
- **Bundler**: Vite for frontend development and building
- **TypeScript**: Full TypeScript support across the stack
- **Development**: Hot module replacement and runtime error overlay

## Key Components

### Frontend Components
1. **Strategy Form**: Interactive form for configuring backtest parameters
2. **Backtest Results**: Comprehensive results display with performance metrics
3. **Performance Chart**: Interactive charts showing portfolio vs benchmark performance
4. **UI Components**: Complete shadcn/ui component library for consistent design

### Backend Services
1. **Express Server**: Main web server handling routing and static file serving
2. **Python Backtesting Engine**: Specialized service for running trading strategy simulations
3. **Strategy Implementations**: Modular trading strategies (SMA Crossover, RSI Threshold)
4. **Data Fetching**: Integration with yfinance for historical market data

### Data Models
1. **Backtest Request**: Validated input parameters for strategy testing
2. **Performance Metrics**: Comprehensive trading performance calculations
3. **Trade Records**: Individual trade execution tracking
4. **Portfolio Snapshots**: Time-series portfolio value tracking

## Data Flow

1. **User Input**: Users configure backtest parameters through the React form
2. **Validation**: Frontend validates inputs using Zod schemas
3. **API Request**: Validated data sent to Python FastAPI backend
4. **Data Retrieval**: Python service fetches historical data via yfinance
5. **Strategy Execution**: Trading strategy runs against historical data
6. **Results Calculation**: Performance metrics and trade history computed
7. **Response**: Results returned to frontend for visualization
8. **Display**: Interactive charts and tables show backtest results

## External Dependencies

### Data Sources
- **yfinance**: Historical stock market data retrieval
- **Yahoo Finance API**: Underlying data source for market information

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Recharts**: Charting library for performance visualization
- **Embla Carousel**: Carousel functionality

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Replit Integration**: Development environment optimization

## Deployment Strategy

### Production Build
- Frontend builds to static files via Vite
- Backend compiles TypeScript to ESM modules via esbuild
- Separate Python service deployment for backtesting engine

### Database Setup
- PostgreSQL database with Drizzle ORM migrations
- Environment-based database URL configuration
- Session storage using connect-pg-simple

### Environment Configuration
- Development: Hot reloading with Vite dev server
- Production: Static file serving with compiled backend
- Database: Environment variable-based configuration

### Key Architectural Decisions

1. **Dual Backend Approach**: Separates web serving (Node.js) from computational work (Python) for optimal performance and maintainability

2. **Type Safety**: Shared TypeScript schemas between frontend and backend ensure consistency

3. **Modern UI Stack**: shadcn/ui provides accessible, customizable components while maintaining design consistency

4. **Modular Strategy System**: Abstract strategy interface allows easy addition of new trading algorithms

5. **Client-Side State Management**: TanStack Query handles caching and synchronization of server state

6. **Database-First Approach**: Drizzle ORM with PostgreSQL provides type-safe database operations

The architecture prioritizes developer experience, type safety, and performance while maintaining clear separation of concerns between different system components.