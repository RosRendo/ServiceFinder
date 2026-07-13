// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiResponse({ status: 200, description: 'Return all reviews.' })
  getAllReviews(@Query() query: any) {
    return this.reviewsService.getAllReviews(query);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiResponse({ status: 200, description: 'Return reviews by current user.' })
  getMyReviews(@Request() req) {
    return this.reviewsService.getMyReviews(req.user.id);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get reviews by company ID' })
  @ApiResponse({ status: 200, description: 'Return reviews for the given company.' })
  getReviewsByCompany(@Param('companyId') companyId: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.reviewsService.getCompanyReviews(companyId, page, limit);
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: 'Get reviews by staff ID' })
  @ApiResponse({ status: 200, description: 'Return reviews for the given staff.' })
  getReviewsByStaff(@Param('staffId') staffId: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.reviewsService.getStaffReviews(staffId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Return review details.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  getReviewById(@Param('id') id: string) {
    return this.reviewsService.getReviewById(BigInt(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'The review has been successfully created.' })
  createReview(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewsService.createReview(createReviewDto, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({ status: 200, description: 'The review has been successfully updated.' })
  updateReview(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto, @Request() req) {
    return this.reviewsService.updateReview(BigInt(id), updateReviewDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'The review has been successfully deleted.' })
  deleteReview(@Param('id') id: string, @Request() req) {
    return this.reviewsService.deleteReview(BigInt(id), req.user);
  }
}

