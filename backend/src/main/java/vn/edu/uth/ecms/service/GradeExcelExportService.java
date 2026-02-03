package vn.edu.uth.ecms.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import vn.edu.uth.ecms.dto.response.GradeStatsResponse;
import vn.edu.uth.ecms.entity.Grade;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

/**
 * Excel Export Service for Grade Statistics
 * @author 
 * @since 
 */
@Service
public class GradeExcelExportService {
    
    /**
     * Export grade statistics to Excel
     * 
     * @param stats Grade statistics
     * @param grades List of all grades
     * @param className Class name
     * @param subjectName Subject name
     * @return Excel file as byte array
     */
    public byte[] exportGradeStatistics(
            GradeStatsResponse stats,
            List<Grade> grades,
            String className,
            String subjectName) throws IOException {
        
        Workbook workbook = new XSSFWorkbook();
        
        // Create styles
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        CellStyle numberStyle = createNumberStyle(workbook);
        CellStyle percentStyle = createPercentStyle(workbook);
        
        // Sheet 1: Overview Statistics
        createOverviewSheet(workbook, stats, className, subjectName, 
                           titleStyle, headerStyle, dataStyle, numberStyle, percentStyle);
        
        // Sheet 2: Detailed Student List
        createDetailedListSheet(workbook, grades, headerStyle, dataStyle, numberStyle);
        
        // Convert to byte array
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        return outputStream.toByteArray();
    }
    
    /**
     * Create overview statistics sheet
     */
    private void createOverviewSheet(
            Workbook workbook, 
            GradeStatsResponse stats,
            String className,
            String subjectName,
            CellStyle titleStyle,
            CellStyle headerStyle,
            CellStyle dataStyle,
            CellStyle numberStyle,
            CellStyle percentStyle) {
        
        Sheet sheet = workbook.createSheet("Thống Kê Tổng Quan");
        sheet.setColumnWidth(0, 6000);
        sheet.setColumnWidth(1, 4000);
        
        int rowNum = 0;
        
        // Title
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("BÁO CÁO THỐNG KÊ ĐIỂM");
        titleCell.setCellStyle(titleStyle);
        
        rowNum++; // Empty row
        
        // Class info
        createInfoRow(sheet, rowNum++, "Lớp học:", className, headerStyle, dataStyle);
        createInfoRow(sheet, rowNum++, "Môn học:", subjectName, headerStyle, dataStyle);
        createInfoRow(sheet, rowNum++, "Ngày xuất:", 
                     java.time.LocalDate.now().toString(), headerStyle, dataStyle);
        
        rowNum++; // Empty row
        
        // Overall Statistics Header
        Row overallHeader = sheet.createRow(rowNum++);
        Cell overallHeaderCell = overallHeader.createCell(0);
        overallHeaderCell.setCellValue("THỐNG KÊ CHUNG");
        overallHeaderCell.setCellStyle(headerStyle);
        
        // Overall stats
        if (stats.getOverall() != null) {
            createStatRow(sheet, rowNum++, "Tổng sinh viên:", 
                         stats.getOverall().getTotalStudents(), dataStyle, numberStyle);
            createStatRow(sheet, rowNum++, "Đã chấm điểm:", 
                         stats.getOverall().getGradedStudents(), dataStyle, numberStyle);
            createStatRow(sheet, rowNum++, "Đang chờ:", 
                         stats.getOverall().getInProgress(), dataStyle, numberStyle);
            createStatPercentRow(sheet, rowNum++, "Tỷ lệ hoàn thành:", 
                               stats.getOverall().getCompletionRate(), dataStyle, percentStyle);
        }
        
        rowNum++; // Empty row
        
        // Score Statistics Header
        Row scoresHeader = sheet.createRow(rowNum++);
        Cell scoresHeaderCell = scoresHeader.createCell(0);
        scoresHeaderCell.setCellValue("THỐNG KÊ ĐIỂM SỐ");
        scoresHeaderCell.setCellStyle(headerStyle);
        
        // Score stats
        if (stats.getScores() != null) {
            createStatDoubleRow(sheet, rowNum++, "Điểm trung bình:", 
                              stats.getScores().getAverageDouble(), dataStyle, numberStyle);
            createStatDoubleRow(sheet, rowNum++, "Điểm cao nhất:", 
                              stats.getScores().getHighestDouble(), dataStyle, numberStyle);
            createStatDoubleRow(sheet, rowNum++, "Điểm thấp nhất:", 
                              stats.getScores().getLowestDouble(), dataStyle, numberStyle);
        }
        
        rowNum++; // Empty row
        
        // Pass/Fail Statistics Header
        Row passFailHeader = sheet.createRow(rowNum++);
        Cell passFailHeaderCell = passFailHeader.createCell(0);
        passFailHeaderCell.setCellValue("KẾT QUẢ ĐẠT/KHÔNG ĐẠT");
        passFailHeaderCell.setCellStyle(headerStyle);
        
        // Pass/Fail stats
        if (stats.getPassFail() != null) {
            createStatRow(sheet, rowNum++, "Số SV đạt:", 
                         stats.getPassFail().getPassedCount(), dataStyle, numberStyle);
            createStatRow(sheet, rowNum++, "Số SV không đạt:", 
                         stats.getPassFail().getFailedCount(), dataStyle, numberStyle);
            createStatPercentRow(sheet, rowNum++, "Tỷ lệ đạt:", 
                               stats.getPassFail().getPassRate(), dataStyle, percentStyle);
        }
        
        rowNum++; // Empty row
        
        // Grade Distribution Header
        Row distHeader = sheet.createRow(rowNum++);
        Cell distHeaderCell = distHeader.createCell(0);
        distHeaderCell.setCellValue("PHÂN BỐ ĐIỂM CHỮ");
        distHeaderCell.setCellStyle(headerStyle);
        
        // Grade distribution table header
        Row gradeHeaderRow = sheet.createRow(rowNum++);
        Cell gradeHeaderCell1 = gradeHeaderRow.createCell(0);
        gradeHeaderCell1.setCellValue("Loại điểm");
        gradeHeaderCell1.setCellStyle(headerStyle);
        
        Cell gradeHeaderCell2 = gradeHeaderRow.createCell(1);
        gradeHeaderCell2.setCellValue("Số lượng");
        gradeHeaderCell2.setCellStyle(headerStyle);
        
        // Grade distribution data
        if (stats.getDistribution() != null) {
            createGradeRow(sheet, rowNum++, "A", stats.getDistribution().getCountA(), dataStyle, numberStyle);
            createGradeRow(sheet, rowNum++, "B+", stats.getDistribution().getCountBPlus(), dataStyle, numberStyle);
            createGradeRow(sheet, rowNum++, "B", stats.getDistribution().getCountB(), dataStyle, numberStyle);
            createGradeRow(sheet, rowNum++, "C+", stats.getDistribution().getCountCPlus(), dataStyle, numberStyle);
            createGradeRow(sheet, rowNum++, "C", stats.getDistribution().getCountC(), dataStyle, numberStyle);
            createGradeRow(sheet, rowNum++, "D+", stats.getDistribution().getCountDPlus(), dataStyle, numberStyle);
            createGradeRow(sheet, rowNum++, "D", stats.getDistribution().getCountD(), dataStyle, numberStyle);
            createGradeRow(sheet, rowNum++, "F", stats.getDistribution().getCountF(), dataStyle, numberStyle);
        }
    }
    
    /**
     * Create detailed student list sheet
     */
    private void createDetailedListSheet(
            Workbook workbook,
            List<Grade> grades,
            CellStyle headerStyle,
            CellStyle dataStyle,
            CellStyle numberStyle) {
        
        Sheet sheet = workbook.createSheet("Danh Sách Chi Tiết");
        
        // Set column widths
        sheet.setColumnWidth(0, 3000);  // STT
        sheet.setColumnWidth(1, 4000);  // MSSV
        sheet.setColumnWidth(2, 6000);  // Họ tên
        sheet.setColumnWidth(3, 3000);  // Điểm TX
        sheet.setColumnWidth(4, 3000);  // Điểm GK
        sheet.setColumnWidth(5, 3000);  // Điểm CK
        sheet.setColumnWidth(6, 3000);  // Điểm TK
        sheet.setColumnWidth(7, 3000);  // Điểm chữ
        sheet.setColumnWidth(8, 4000);  // Trạng thái
        
        int rowNum = 0;
        
        // Header row
        Row headerRow = sheet.createRow(rowNum++);
        String[] headers = {"STT", "MSSV", "Họ và tên", "Điểm TX", "Điểm GK", 
                           "Điểm CK", "Điểm TK", "Điểm chữ", "Trạng thái"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // Data rows
        int stt = 1;
        for (Grade grade : grades) {
            Row dataRow = sheet.createRow(rowNum++);
            
            // STT
            Cell sttCell = dataRow.createCell(0);
            sttCell.setCellValue(stt++);
            sttCell.setCellStyle(numberStyle);
            
            // MSSV
            Cell mssvCell = dataRow.createCell(1);
            mssvCell.setCellValue(grade.getStudent().getStudentCode());
            mssvCell.setCellStyle(dataStyle);
            
            // Họ tên
            Cell nameCell = dataRow.createCell(2);
            nameCell.setCellValue(grade.getStudent().getFullName());
            nameCell.setCellStyle(dataStyle);
            
            // Điểm TX
            Cell regularCell = dataRow.createCell(3);
            if (grade.getRegularScore() != null) {
                regularCell.setCellValue(grade.getRegularScore().doubleValue());
                regularCell.setCellStyle(numberStyle);
            } else {
                regularCell.setCellValue("-");
                regularCell.setCellStyle(dataStyle);
            }
            
            // Điểm GK
            Cell midtermCell = dataRow.createCell(4);
            if (grade.getMidtermScore() != null) {
                midtermCell.setCellValue(grade.getMidtermScore().doubleValue());
                midtermCell.setCellStyle(numberStyle);
            } else {
                midtermCell.setCellValue("-");
                midtermCell.setCellStyle(dataStyle);
            }
            
            // Điểm CK
            Cell finalCell = dataRow.createCell(5);
            if (grade.getFinalScore() != null) {
                finalCell.setCellValue(grade.getFinalScore().doubleValue());
                finalCell.setCellStyle(numberStyle);
            } else {
                finalCell.setCellValue("-");
                finalCell.setCellStyle(dataStyle);
            }
            
            // Điểm TK
            Cell totalCell = dataRow.createCell(6);
            if (grade.getTotalScore() != null) {
                totalCell.setCellValue(grade.getTotalScore().doubleValue());
                totalCell.setCellStyle(numberStyle);
            } else {
                totalCell.setCellValue("-");
                totalCell.setCellStyle(dataStyle);
            }
            
            // Điểm chữ
            Cell letterCell = dataRow.createCell(7);
            if (grade.getLetterGrade() != null) {
                letterCell.setCellValue(grade.getLetterGrade());
                letterCell.setCellStyle(dataStyle);
            } else {
                letterCell.setCellValue("-");
                letterCell.setCellStyle(dataStyle);
            }
            
            // Trạng thái
            Cell statusCell = dataRow.createCell(8);
            if (grade.getStatus() != null) {
                String statusText = switch (grade.getStatus()) {
                    case PASSED -> "Đạt";
                    case FAILED -> "Không đạt";
                    case IN_PROGRESS -> "Đang học";
                };
                statusCell.setCellValue(statusText);
                statusCell.setCellStyle(dataStyle);
            } else {
                statusCell.setCellValue("-");
                statusCell.setCellStyle(dataStyle);
            }
        }
    }
    
    
    
    private void createInfoRow(Sheet sheet, int rowNum, String label, String value,
                               CellStyle labelStyle, CellStyle valueStyle) {
        Row row = sheet.createRow(rowNum);
        
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);
        
        Cell valueCell = row.createCell(1);
        valueCell.setCellValue(value);
        valueCell.setCellStyle(valueStyle);
    }
    
    private void createStatRow(Sheet sheet, int rowNum, String label, Integer value,
                              CellStyle labelStyle, CellStyle valueStyle) {
        Row row = sheet.createRow(rowNum);
        
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);
        
        Cell valueCell = row.createCell(1);
        if (value != null) {
            valueCell.setCellValue(value);
            valueCell.setCellStyle(valueStyle);
        }
    }
    
    private void createStatDoubleRow(Sheet sheet, int rowNum, String label, Double value,
                                    CellStyle labelStyle, CellStyle valueStyle) {
        Row row = sheet.createRow(rowNum);
        
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);
        
        Cell valueCell = row.createCell(1);
        if (value != null) {
            valueCell.setCellValue(value);
            valueCell.setCellStyle(valueStyle);
        }
    }
    
    private void createStatPercentRow(Sheet sheet, int rowNum, String label, Double value,
                                     CellStyle labelStyle, CellStyle percentStyle) {
        Row row = sheet.createRow(rowNum);
        
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);
        
        Cell valueCell = row.createCell(1);
        if (value != null) {
            valueCell.setCellValue(value / 100.0); 
            valueCell.setCellStyle(percentStyle);
        }
    }
    
    private void createGradeRow(Sheet sheet, int rowNum, String grade, Integer count,
                               CellStyle labelStyle, CellStyle valueStyle) {
        Row row = sheet.createRow(rowNum);
        
        Cell gradeCell = row.createCell(0);
        gradeCell.setCellValue(grade);
        gradeCell.setCellStyle(labelStyle);
        
        Cell countCell = row.createCell(1);
        if (count != null) {
            countCell.setCellValue(count);
        } else {
            countCell.setCellValue(0);
        }
        countCell.setCellStyle(valueStyle);
    }
    

    
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
    
    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }
    
    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
    
    private CellStyle createNumberStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setDataFormat(workbook.createDataFormat().getFormat("0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
    
    private CellStyle createPercentStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setDataFormat(workbook.createDataFormat().getFormat("0.00%"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
}