import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { StreamService } from './stream.service';
import { IStreamRepository } from '../../domain/repositories/stream.repository.interface';
import { Stream } from '../../domain/entities/stream.entity';
import { v4 as uuidv4 } from 'uuid';

describe('StreamService', () => {
  let service: StreamService;
  let streamRepository: jest.Mocked<IStreamRepository>;

  const mockUserId = 'user-123';
  const mockStreamId = 'stream-456';
  
  const mockStream: Stream = {
    id: mockStreamId,
    ownerId: mockUserId,
    title: 'Test Stream',
    description: 'Test Description',
    thumbnailUrl: null,
    streamKey: 'key-123',
    status: 'waiting',
    viewerCount: 0,
    maxViewers: 0,
    allowComments: true,
    commentCooldown: 1000,
    maxCommentLength: 200,
    allowAnonymous: false,
    startedAt: null,
    endedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockStreamRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOwnerId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      incrementViewerCount: jest.fn(),
      decrementViewerCount: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamService,
        {
          provide: 'STREAM_REPOSITORY',
          useValue: mockStreamRepository,
        },
      ],
    }).compile();

    service = module.get<StreamService>(StreamService);
    streamRepository = module.get('STREAM_REPOSITORY');
  });

  describe('create', () => {
    const createDto = {
      title: 'New Stream',
      description: 'New Description',
    };

    it('should create a new stream', async () => {
      streamRepository.create.mockResolvedValue(mockStream);

      const result = await service.create(mockUserId, createDto);

      expect(result).toEqual(mockStream);
      expect(streamRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: mockUserId,
          title: createDto.title,
          description: createDto.description,
          streamKey: expect.any(String),
        })
      );
    });

    it('should generate unique stream key', async () => {
      streamRepository.create.mockResolvedValue(mockStream);

      await service.create(mockUserId, createDto);
      const createCall = streamRepository.create.mock.calls[0][0];

      expect(createCall.streamKey).toBeDefined();
      expect(createCall.streamKey.length).toBeGreaterThan(0);
    });
  });

  describe('findById', () => {
    it('should return stream with owner details', async () => {
      streamRepository.findById.mockResolvedValue({
        ...mockStream,
        owner: {
          id: mockUserId,
          username: 'testuser',
          email: 'test@example.com',
          level: 1,
        },
      } as any);

      const result = await service.findById(mockStreamId, mockUserId);

      expect(result).toMatchObject({
        id: mockStreamId,
        title: mockStream.title,
        streamKey: mockStream.streamKey, // Should include streamKey for owner
      });
      expect(streamRepository.findById).toHaveBeenCalledWith(mockStreamId);
    });

    it('should hide stream key for non-owner', async () => {
      streamRepository.findById.mockResolvedValue({
        ...mockStream,
        owner: {
          id: mockUserId,
          username: 'testuser',
          email: 'test@example.com',
          level: 1,
        },
      } as any);

      const result = await service.findById(mockStreamId, 'other-user');

      expect(result.streamKey).toBeUndefined();
    });

    it('should throw NotFoundException for non-existent stream', async () => {
      streamRepository.findById.mockResolvedValue(null);

      await expect(service.findById(mockStreamId, mockUserId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('start', () => {
    it('should start a waiting stream', async () => {
      streamRepository.findById.mockResolvedValue(mockStream);
      streamRepository.updateStatus.mockResolvedValue({
        ...mockStream,
        status: 'live',
        startedAt: new Date(),
      });

      const result = await service.start(mockStreamId, mockUserId);

      expect(result.status).toBe('live');
      expect(streamRepository.updateStatus).toHaveBeenCalledWith(mockStreamId, 'live');
    });

    it('should throw ForbiddenException for non-owner', async () => {
      streamRepository.findById.mockResolvedValue(mockStream);

      await expect(service.start(mockStreamId, 'other-user'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if stream is already live', async () => {
      streamRepository.findById.mockResolvedValue({
        ...mockStream,
        status: 'live',
      });

      await expect(service.start(mockStreamId, mockUserId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('end', () => {
    it('should end a live stream', async () => {
      const liveStream = { ...mockStream, status: 'live', startedAt: new Date() };
      streamRepository.findById.mockResolvedValue(liveStream);
      streamRepository.updateStatus.mockResolvedValue({
        ...liveStream,
        status: 'ended',
        endedAt: new Date(),
      });

      const result = await service.end(mockStreamId, mockUserId);

      expect(result.status).toBe('ended');
      expect(streamRepository.updateStatus).toHaveBeenCalledWith(mockStreamId, 'ended');
    });

    it('should throw BadRequestException if stream is not live', async () => {
      streamRepository.findById.mockResolvedValue(mockStream);

      await expect(service.end(mockStreamId, mockUserId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete a stream', async () => {
      streamRepository.findById.mockResolvedValue(mockStream);
      streamRepository.delete.mockResolvedValue(true);

      await service.delete(mockStreamId, mockUserId);

      expect(streamRepository.delete).toHaveBeenCalledWith(mockStreamId);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      streamRepository.findById.mockResolvedValue(mockStream);

      await expect(service.delete(mockStreamId, 'other-user'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if stream is live', async () => {
      streamRepository.findById.mockResolvedValue({
        ...mockStream,
        status: 'live',
      });

      await expect(service.delete(mockStreamId, mockUserId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('incrementViewerCount', () => {
    it('should increment viewer count', async () => {
      await service.incrementViewerCount(mockStreamId);

      expect(streamRepository.incrementViewerCount).toHaveBeenCalledWith(mockStreamId);
    });
  });

  describe('decrementViewerCount', () => {
    it('should decrement viewer count', async () => {
      await service.decrementViewerCount(mockStreamId);

      expect(streamRepository.decrementViewerCount).toHaveBeenCalledWith(mockStreamId);
    });
  });
});